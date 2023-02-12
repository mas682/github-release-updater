module.exports = class TagUpdater {
  constructor() {

  }
  /**
   * Function to control updating release tags on new commits
   * @param github
   * @param context
   * @param {boolean} includeLatest Indicates if the latest tag should be created.  This will only be created/updated if
   * the major or minor tag are also being updated
   * @param {string} commitMessage The commit message to parse; Needed to determine what tags to create
   * Flags can include [tag-major] or [tag-minor]
   * If the requireFlag is false, the defaultType will automatically be used
   * @param {boolean} requireFlag If false, the minor tag will be updated.  If true, tags will only be updated if the right flag
   * is in the commit message
   * @param {string} defaultType This is only considered if the REQUIRE_FLAG is false.  This allows you to automatically update the
   * major or minor part of a tag automatically.  Possible values are tag-minor or tag-major
   */
  async updateTags (github, context, includeLatest, commitMessage, requireFlag, defaultType) {
    let latestTagResult;
    let latestTag;
    const tagType = this.parseCommitMessage(commitMessage, requireFlag, defaultType, includeLatest);
    let checkTag = true;

    if (!tagType.minor && !tagType.major && !tagType.latest) {
      console.log('No release updates to apply');
      return;
    }

    while (checkTag) {
      latestTagResult = await this.getLatestVersion(github, context);
      if (latestTagResult) {
        latestTag = latestTagResult.tag;
      } else {
        latestTag = undefined;
      }
      console.log('Latest tag: ' + latestTag);

      if (latestTag === 'latest') {
        await this.deleteLatestRelease(github, context, latestTagResult, latestTag);
      } else {
        checkTag = false;
      }
    }

    const newTags = this.generateNewTags(latestTag, tagType);
    if (newTags.length === 0) {
      throw new Error('Could not determine the tags to update based off the tag on the latest release: ' + latestTag);
    }

    for (const tag of newTags) {
      console.log('Creating new release with a tag of: ' + tag);
      await this.createRelease(github, context, tag);
    }

    return newTags;
  }

  /**
   * Parses the commit message to see what type of tag to create with the commit
   * Note that tag-major gets precedence if both [tag-major] and [tag-minor] are in the commit message
   * @param {String} commitMessage Commit message for the commit
   * @param {boolean} requireFlag Determines if a flag in the commit message is needed to create new tags
   * or if it should use the default
   * The current supported flags are [tag-major] and [tag-minor]
   * @param {String} defaultType Determines the default tag type to update.  Only used if requireFlag is False
   * @param {boolean} includeLatest Boolean flag to determine if the latest tag will be created/updated
   * If set to true, you can override this for a commit by including the flag [skip-latest]
   * @return {object} A object containing 3 flags (major, minor, and latest).  If any are true a tag should be created/updated
   */
  parseCommitMessage (commitMessage, requireFlag, defaultType, includeLatest) {
    const result = {
      minor: false,
      major: false,
      latest: false
    };
    if (commitMessage.includes('[tag-major]')) {
      result.major = true;
    } else if (commitMessage.includes('[tag-minor]')) {
      result.minor = true;
    } else if (!requireFlag && defaultType === 'tag-major') {
      result.major = true;
    } else if (!requireFlag && defaultType === 'tag-minor') {
      result.minor = true;
    }

    // if creating/updating a minor/major tag and the include latest flag is set and
    // [skip-latest] is not in the commit message
    if ((result.major || result.minor) && includeLatest) {
      result.latest = true;
    }

    return result;
  }

  /**
   * Function to determine what the next tags should be
   * @param {string} latestTag The current tag such as v0.0 or undefined
   * @param {object} tagTypes A object containing 3 flags (major, minor, and latest).  If any are true a tag should be created/updated
   * @returns Array containing the tags to update.  If empty, there are no tags to update
   */
  generateNewTags (latestTag, tagTypes) { 
    let versionNumber;
    let majorMinor;
    const result = [];

    if (!latestTag) {
      result.push('v1.0');
    } else if (/v[0-9]*\.[0-9]*$/.test(latestTag)) {
      versionNumber = latestTag.slice(1);
      majorMinor = versionNumber.split('.');
      if (tagTypes.major) {
        result.push('v' + (parseInt(majorMinor[0]) + 1) + '.0');
      } else if (tagTypes.minor) {
        result.push('v' + majorMinor[0] + '.' + (parseInt(majorMinor[1]) + 1));
      }
    }

    if (tagTypes.latest) {
      result.push('latest');
    }

    return result;
  }

  /**
   * Function to control the deletion of a release and the tag associated with it
   * @param {object} github Object to make git API calls
   * @param {object} context Object holding the context of the current workflow run
   * @param {object} latestTagResult A object containing keys for data and the releaseID to delete
   * @param {string} latestTag The value of the tag on the latest release
   */
  async deleteLatestRelease (github, context, latestTagResult, latestTag) {
    console.log('Deleting the latest release...');
    // output this in case of a release is accidentally deleted
    console.log('Release information: ');
    console.log(latestTagResult.data);
    console.log('Commit sha for the latest tag: ' + latestTagResult.data.target_commitish);

    const releaseRemoved = await this.deleteRelease(github, context, latestTagResult.releaseID);
    if (releaseRemoved) {
      console.log('Release successfully removed');
    } else {
      console.log('Release could not be found');
    }

    const tagRemoved = await this.deleteTag(github, context, latestTag);
    if (tagRemoved) {
      console.log('The tag ' + latestTag + ' was successfully removed');
    } else {
      console.log('The tag ' + latestTag + ' could not be found');
    }
  }

  async getLatestVersion (github, context) {
    let latestTag;
    let result;
    let releaseID;
    let data;
    try {
      result = await github.rest.repos.getLatestRelease({
        owner: context.repo.owner,
        repo: context.repo.repo
      });
    } catch (error) {
      if (error.name === 'HttpError' && error.message === 'Not Found') {
        result = error.response;
      }

      if (!result) {
        throw error;
      }
    }

    switch (result.status) {
      case 200:
        latestTag = result.data.tag_name;
        releaseID = result.data.id;
        data = result.data;
        break;
      case 404:
        latestTag = undefined;
        break;
      default:
        throw new Error('Unexpected status code returned when getting the latest release: ' + result.status);
    }

    return {
      tag: latestTag,
      releaseID,
      data
    };
  }

  async createRelease (github, context, tag) {
    const result = await github.rest.repos.createRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag_name: tag,
      make_latest: 'true',
      target_commitish: context.payload.head_commit.id
    });

    if (result.status !== 201) {
      throw new Error('Unexpected status code returned when creating the release: ' + result.status);
    }

    return result;
  }

  async deleteRelease (github, context, releaseID) {
    let result;
    let releaseFound = false;

    try {
      result = await github.rest.repos.deleteRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseID
      });
    } catch (error) {
      if (error.name === 'HttpError' && error.message === 'Not Found') {
        result = error.response;
      }

      if (!result) {
        throw error;
      }
    }

    switch (result.status) {
      case 204:
        releaseFound = true;
        break;
      case 404:
        releaseFound = false;
        break;
      default:
        throw new Error('Unexpected status code returned when deleting the release: ' + result.status);
    }

    return releaseFound;
  }

  async deleteTag (github, context, tag) {
    let result;
    let tagFound = false;
    try {
      result = await github.rest.git.deleteRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: 'tags/' + tag
      });
    } catch (error) {
      if (error.name === 'HttpError' && error.message === 'Not Found') {
        result = error.response;
      }

      if (!result) {
        throw error;
      }
    }

    switch (result.status) {
      case 204:
        tagFound = true;
        break;
      case 404:
        tagFound = false;
        break;
      default:
        throw new Error('Unexpected status code returned when deleting the tag: ' + result.status);
    }

    return tagFound;
  }
};
