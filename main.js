module.exports = async ({github, context}) => {
  const TagUpdater = require('./TagUpdater');
  let includeLatest = process.env.INCLUDE_LATEST == "true";
  let commitMessage = process.env.COMMIT_MESSAGE;
  let requireFlag = process.env.REQUIRE_FLAG == "true";
  let defaultType = process.env.DEFAULT_TYPE;
  console.log("Update latest tag: " + includeLatest);
  console.log("Commit message: " + commitMessage);
  console.log("Require flags in commit message: " + requireFlag);
  console.log("Default release tag update type: " + defaultType);
  let tagUpdater = new TagUpdater();
  tagUpdater.updateTags(github, context, includeLatest, commitMessage, requireFlag, defaultType);
};