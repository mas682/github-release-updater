const TagUpdater = require('../TagUpdater');
const tagUpdater = new TagUpdater();

describe('updateTags', () => {
  let parseCommitMessage = undefined;
  let getLatestVersion = undefined;
  let deleteLatestRelease = undefined;
  let generateNewTags = undefined;
  let createRelease = undefined;
  let logSpy = undefined;

  beforeEach(() => {
    // clear the state of the log spy
    parseCommitMessage = jest.spyOn(TagUpdater.prototype, 'parseCommitMessage');
    getLatestVersion = jest.spyOn(TagUpdater.prototype,  'getLatestVersion');
    deleteLatestRelease = jest.spyOn(TagUpdater.prototype, 'deleteLatestRelease');
    generateNewTags = jest.spyOn(TagUpdater.prototype, 'generateNewTags');
    createRelease = jest.spyOn(TagUpdater.prototype, 'createRelease');
    logSpy = jest.spyOn(global.console, 'log');
  });

  afterEach(() => {
    parseCommitMessage.mockRestore();
    getLatestVersion.mockRestore();
    deleteLatestRelease.mockRestore();
    generateNewTags.mockRestore();
    createRelease.mockRestore();
    logSpy.mockRestore();
  });

  test('no release updates', async() => {
    parseCommitMessage.mockImplementationOnce(() => {
      return {
        minor: false,
        major: false,
        latest: false
      };
    });

    await tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined);
    expect(logSpy).toHaveBeenCalledWith("No release updates to apply");
  });
  
  test('no tags found', async() => {
    let newTags = ["v1.0", "latest"];
    let latestTag = undefined;
    let tagTypes = {
      minor: true,
      major: false,
      latest: true
    };

    parseCommitMessage.mockImplementationOnce(() => {
      return tagTypes;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag;
    });

    generateNewTags.mockImplementationOnce(() => {
      return newTags;
    });

    createRelease.mockImplementation(() => {
      return undefined;
    });

    await tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined);
    expect(getLatestVersion).toHaveBeenCalledTimes(1);
    expect(deleteLatestRelease).toHaveBeenCalledTimes(0);
    expect(generateNewTags).toHaveBeenCalledTimes(1);
    expect(generateNewTags).toHaveBeenCalledWith(latestTag, tagTypes);
    expect(createRelease).toHaveBeenCalledTimes(2);
  });

  test('updating minor version', async() => {
    let newTags = ["v2.3"];
    let latestTag = {
      tag: "v2.2",
      releaseID: 1234,
      data: undefined
    };
    let tagTypes = {
      minor: true,
      major: false,
      latest: false
    };

    parseCommitMessage.mockImplementationOnce(() => {
      return tagTypes;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag;
    });

    generateNewTags.mockImplementationOnce(() => {
      return newTags;
    });

    createRelease.mockImplementationOnce(() => {
      return undefined;
    });

    await tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined);
    expect(getLatestVersion).toHaveBeenCalledTimes(1);
    expect(deleteLatestRelease).toHaveBeenCalledTimes(0);
    expect(generateNewTags).toHaveBeenCalledTimes(1);
    expect(generateNewTags).toHaveBeenCalledWith(latestTag.tag, tagTypes);
    expect(createRelease).toHaveBeenCalledTimes(1);
  });

  test('updating major version', async() => {
    let newTags = ["v3.0"];
    let latestTag = {
      tag: "v2.2",
      releaseID: 1234,
      data: undefined
    };
    let tagTypes = {
      minor: false,
      major: true,
      latest: false
    };

    parseCommitMessage.mockImplementationOnce(() => {
      return tagTypes;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag;
    });

    generateNewTags.mockImplementationOnce(() => {
      return newTags;
    });

    createRelease.mockImplementationOnce(() => {
      return undefined;
    });

    await tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined);
    expect(getLatestVersion).toHaveBeenCalledTimes(1);
    expect(deleteLatestRelease).toHaveBeenCalledTimes(0);
    expect(generateNewTags).toHaveBeenCalledTimes(1);
    expect(generateNewTags).toHaveBeenCalledWith(latestTag.tag, tagTypes);
    expect(createRelease).toHaveBeenCalledTimes(1);
  });

  test('updating minor version and latest with latest found', async() => {
    let newTags = ["v2.3", "latest"];
    let latestTag1 = {
      tag: "latest",
      releaseID: 1234,
      data: undefined
    };
    let latestTag2 = {
      tag: "v2.2",
      releaseID: 1234,
      data: undefined
    };
    let tagTypes = {
      minor: true,
      major: false,
      latest: true
    };

    parseCommitMessage.mockImplementationOnce(() => {
      return tagTypes;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag1;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag2;
    });

    generateNewTags.mockImplementationOnce(() => {
      return newTags;
    });

    deleteLatestRelease.mockImplementationOnce(() => {
      return undefined;
    });

    createRelease.mockImplementation(() => {
      return undefined;
    });

    await tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined);
    expect(getLatestVersion).toHaveBeenCalledTimes(2);
    expect(deleteLatestRelease).toHaveBeenCalledTimes(1);
    expect(deleteLatestRelease).toHaveBeenCalledWith(undefined, undefined, latestTag1, latestTag1.tag);
    expect(generateNewTags).toHaveBeenCalledTimes(1);
    expect(generateNewTags).toHaveBeenCalledWith(latestTag2.tag, tagTypes);
    expect(createRelease).toHaveBeenCalledTimes(2);
  });

  test('updating major version and latest with latest found', async() => {
    let newTags = ["v3.0", "latest"];
    let latestTag1 = {
      tag: "latest",
      releaseID: 1234,
      data: undefined
    };
    let latestTag2 = {
      tag: "v2.2",
      releaseID: 1234,
      data: undefined
    };
    let tagTypes = {
      minor: false,
      major: true,
      latest: true
    };

    parseCommitMessage.mockImplementationOnce(() => {
      return tagTypes;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag1;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag2;
    });

    generateNewTags.mockImplementationOnce(() => {
      return newTags;
    });

    deleteLatestRelease.mockImplementationOnce(() => {
      return undefined;
    });

    createRelease.mockImplementation(() => {
      return undefined;
    });

    await tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined);
    expect(getLatestVersion).toHaveBeenCalledTimes(2);
    expect(deleteLatestRelease).toHaveBeenCalledTimes(1);
    expect(deleteLatestRelease).toHaveBeenCalledWith(undefined, undefined, latestTag1, latestTag1.tag);
    expect(generateNewTags).toHaveBeenCalledTimes(1);
    expect(generateNewTags).toHaveBeenCalledWith(latestTag2.tag, tagTypes);
    expect(createRelease).toHaveBeenCalledTimes(2);
  });

  test('updating minor version but invalid tag found', async() => {
    let newTags = [];
    let latestTag = {
      tag: "invalid",
      releaseID: 1234,
      data: undefined
    };
    let tagTypes = {
      minor: true,
      major: false,
      latest: false
    };

    parseCommitMessage.mockImplementationOnce(() => {
      return tagTypes;
    });

    getLatestVersion.mockImplementationOnce(() => {
      return latestTag;
    });

    generateNewTags.mockImplementationOnce(() => {
      return newTags;
    });

    await expect(tagUpdater.updateTags(undefined, undefined, undefined, undefined, undefined, undefined))
    .rejects
    .toThrow(new Error('Could not determine the tags to update based off the tag on the latest release: ' + latestTag.tag));
    expect(getLatestVersion).toHaveBeenCalledTimes(1);
    expect(deleteLatestRelease).toHaveBeenCalledTimes(0);
    expect(generateNewTags).toHaveBeenCalledTimes(1);
    expect(generateNewTags).toHaveBeenCalledWith(latestTag.tag, tagTypes);
    expect(createRelease).toHaveBeenCalledTimes(0);
  });
});


describe('parseCommitMessage', () => {
  test('tag-major only', () => {
    let message = "Test commit [tag-major]";
    let requireFlag = true;
    let defaultType = undefined;
    let includeLatest = false;

    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: true, 
      minor: false
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('tag-minor only', () => {
    let message = "Test commit [tag-minor]";
    let requireFlag = true;
    let defaultType = undefined;
    let includeLatest = false;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: false, 
      minor: true
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('tag-minor and tag-major flags', () => {
    let message = "Test commit [tag-minor] [tag-major]";
    let requireFlag = true;
    let defaultType = undefined;
    let includeLatest = false;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: true, 
      minor: false
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('default major', () => {
    let message = "Test commit";
    let requireFlag = false;
    let defaultType = "tag-major";
    let includeLatest = false;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: true, 
      minor: false
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('default minor', () => {
    let message = "Test commit";
    let requireFlag = false;
    let defaultType = "tag-minor";
    let includeLatest = false;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: false, 
      minor: true
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('default invalid value', () => {
    let message = "Test commit";
    let requireFlag = false;
    let defaultType = "tag-invalid";
    let includeLatest = false;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: false, 
      minor: false
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('default with require flag value', () => {
    let message = "Test commit";
    let requireFlag = true;
    let defaultType = "tag-invalid";
    let includeLatest = false;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: false, 
      minor: false
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('include latest', () => {
    let message = "Test commit [tag-minor]";
    let requireFlag = false;
    let defaultType = undefined;
    let includeLatest = true;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: true,
      major: false, 
      minor: true
    };
    expect(result).toStrictEqual(expectedResult);
  });

  test('include latest without other tags', () => {
    let message = "Test commit";
    let requireFlag = false;
    let defaultType = undefined;
    let includeLatest = true;
    
    let result = tagUpdater.parseCommitMessage(message, requireFlag, defaultType, includeLatest);
    let expectedResult = {
      latest: false,
      major: false, 
      minor: false
    };
    expect(result).toStrictEqual(expectedResult);
  });
});

describe('generateNewTags', () => {
  test('undefined latest tag', () => {
    let latestTag = undefined;
    let tagTypes = {
      minor: false,
      major: false,
      latest: false
    };
  
    let result = tagUpdater.generateNewTags(latestTag, tagTypes);
    let expectedResult = ["v1.0"];
    expect(result).toStrictEqual(expectedResult);
  });
  
  test('undefined latest tag and include latest', () => {
    let latestTag = undefined;
    let tagTypes = {
      minor: false,
      major: false,
      latest: true
    };
    
    let result = tagUpdater.generateNewTags(latestTag, tagTypes);
    let expectedResult = ["v1.0", "latest"];
    expect(result).toStrictEqual(expectedResult);
  });
  
  test('update major', () => {
    let latestTag = "v2.3";
    let tagTypes = {
      minor: false,
      major: true,
      latest: false
    };
      
    let result = tagUpdater.generateNewTags(latestTag, tagTypes);
    let expectedResult = ["v3.0"];
    expect(result).toStrictEqual(expectedResult);
  });
  
  test('update minor', () => {
    let latestTag = "v2.3";
    let tagTypes = {
      minor: true,
      major: false,
      latest: false
    };
      
    let result = tagUpdater.generateNewTags(latestTag, tagTypes);
    let expectedResult = ["v2.4"];
    expect(result).toStrictEqual(expectedResult);
  });
  
  test('update major with latest', () => {
    let latestTag = "v2.3";
    let tagTypes = {
      minor: false,
      major: true,
      latest: true
    };
      
    let result = tagUpdater.generateNewTags(latestTag, tagTypes);
    let expectedResult = ["v3.0", "latest"];
    expect(result).toStrictEqual(expectedResult);
  });
  
  test('update minor with latest', () => {
    let latestTag = "v2.3";
    let tagTypes = {
      minor: true,
      major: false,
      latest: true
    };
      
    let result = tagUpdater.generateNewTags(latestTag, tagTypes);
    let expectedResult = ["v2.4", "latest"];
    expect(result).toStrictEqual(expectedResult);
  });
});

describe('deleteLatestRelease', () => {
  let deleteRelease = undefined;
  let deleteTag = undefined;
  let logSpy = undefined;

  beforeEach(() => {
    deleteRelease = jest.spyOn(TagUpdater.prototype, 'deleteRelease');
    deleteTag = jest.spyOn(TagUpdater.prototype, 'deleteTag');
    logSpy = jest.spyOn(global.console, 'log');
  });

  afterEach(() => {
    deleteRelease.mockRestore();
    deleteTag.mockRestore();
    logSpy.mockRestore();
  });
  

  test('test undefined release and release tag', async() => {
    deleteRelease.mockImplementationOnce(() => {
      return undefined;
    });
    deleteTag.mockImplementationOnce(() => {
      return undefined;
    });

    let latestTagResult = {
      releaseID: undefined,
      data: {}
    };
    let latestTag = "latest";
    await tagUpdater.deleteLatestRelease(undefined, undefined, latestTagResult, latestTag);
    expect(logSpy).toHaveBeenCalledWith("Deleting the latest release...");
    expect(logSpy).toHaveBeenCalledWith("Release information: ");
    expect(logSpy).toHaveBeenCalledWith({});
    expect(logSpy).toHaveBeenCalledWith("Release could not be found");
    expect(logSpy).toHaveBeenCalledWith("The tag latest could not be found");
  });

  test('test found release and release tag', async() => {
    deleteRelease.mockImplementationOnce(() => {
      return true;
    });
    deleteTag.mockImplementationOnce(() => {
      return true;
    });

    let latestTagResult = {
      releaseID: undefined,
      data: {}
    };
    let latestTag = "latest";
    await tagUpdater.deleteLatestRelease(undefined, undefined, latestTagResult, latestTag);
    expect(logSpy).toHaveBeenCalledWith("Deleting the latest release...");
    expect(logSpy).toHaveBeenCalledWith("Release information: ");
    expect(logSpy).toHaveBeenCalledWith({});
    expect(logSpy).toHaveBeenCalledWith("Release successfully removed");
    expect(logSpy).toHaveBeenCalledWith("The tag latest was successfully removed");
  });
});

describe('getLatestVersion', () => {
  let github = {
    rest: {
      repos: {
        getLatestRelease: jest.fn()
      }
    }
  };
  let context = {
    repo: {
      owner: undefined,
      repo: undefined
    }
  };

  test('successfully found', async () => {
    let data = {
      tag_name: "latest",
      id: 1234
    };
    github.rest.repos.getLatestRelease.mockImplementationOnce(() => {
      return {
        status: 200,
        data: data
      };
    });
  
    let expectedResult = {
      data: data,
      releaseID: 1234,
      tag: "latest"
    };

    let result = await tagUpdater.getLatestVersion(github, context);
    expect(result).toStrictEqual(expectedResult);
  });


  test('not found', async () => {
    github.rest.repos.getLatestRelease.mockImplementationOnce(() => {
      let e = new Error("Not found");
      e.name = "HttpError";
      e.message = "Not Found";
      e.response = {
        status: 404
      };
      throw e;
    });
  
    let expectedResult = {
      data: undefined,
      releaseID: undefined,
      tag: undefined
    };
    let result = await tagUpdater.getLatestVersion(github, context);
    expect(result).toStrictEqual(expectedResult);
  });

  test('unauthorized', async () => {
    github.rest.repos.getLatestRelease.mockImplementationOnce(() => {
      let e = new Error("Unauthorized");
      e.name = "HttpError";
      e.message = "Unauthorized";
      e.response = {
        status: 401
      };
      throw e;
    });
  
    await expect(tagUpdater.getLatestVersion(github, context))
    .rejects
    .toThrow(new Error('Unauthorized'));
  });

  test('sever error', async () => {
    let data = {
      tag_name: undefined,
      id: undefined
    };
    github.rest.repos.getLatestRelease.mockImplementationOnce(() => {
      return {
        status: 500,
        data: data
      };
    });

    await expect(tagUpdater.getLatestVersion(github, context))
    .rejects
    .toThrow(new Error('Unexpected status code returned when getting the latest release: 500'));
  });
});

describe('createRelease', () => {
  // tagUpdater.createRelease.mockRestore();
  let createRelease = jest.fn();
  let github = {
    rest: {
      repos: {
        createRelease: createRelease
      }
    }
  };

  let context = {
    repo: {
      owner: undefined,
      repo: undefined
    },
    payload: {
      head_commit: {
        id: undefined
      }
    }
  };

  test('successfully created', async () => {
    let tag = "latest";

    createRelease.mockImplementationOnce(() => {
      return {
        status: 201
      };
    });
    
    await tagUpdater.createRelease(github, context, tag);
    expect(createRelease).toHaveBeenCalledTimes(1);
  });

  test('not successfully created', async () => {
    let tag = "latest";
    github.rest.repos.createRelease.mockImplementationOnce(() => {
      return {
        status: 500
      };
    });

    await expect(tagUpdater.createRelease(github, context, tag))
    .rejects
    .toThrow(new Error('Unexpected status code returned when creating the release: 500'));
  });

  test('unauthorized', async () => {
    let tag = "latest";
    github.rest.repos.createRelease.mockImplementationOnce(() => {
      let e = new Error("Not Found");
      e.name = "HttpError";
      e.message = "Not Found";
      e.response = {
        status: 404
      };
      throw e;
    });

    await expect(tagUpdater.createRelease(github, context, tag))
    .rejects
    .toThrow(new Error('Not Found'));
  });
});

describe('deleteRelease', () => {
  let github = {
    rest: {
      repos: {
        deleteRelease: jest.fn()
      }
    }
  };
  let context = {
    repo: {
      owner: undefined,
      repo: undefined
    }
  };

  test('successfully deleted', async () => {
    github.rest.repos.deleteRelease.mockImplementationOnce(() => {
      return {
        status: 204
      };
    });

    let result = await tagUpdater.deleteRelease(github, context);
    expect(result).toStrictEqual(true);
  });

  test('not found', async () => {
    github.rest.repos.deleteRelease.mockImplementationOnce(() => {
      let e = new Error("Not found");
      e.name = "HttpError";
      e.message = "Not Found";
      e.response = {
        status: 404
      };
      throw e;
    });

    let result = await tagUpdater.deleteRelease(github, context);
    expect(result).toStrictEqual(false);
  });

  test('unauthorized', async () => {
    github.rest.repos.deleteRelease.mockImplementationOnce(() => {
      let e = new Error("Unauthorized");
      e.name = "HttpError";
      e.message = "Unauthorized";
      e.response = {
        status: 401
      };
      throw e;
    });

    await expect(tagUpdater.deleteRelease(github, context))
    .rejects
    .toThrow(new Error('Unauthorized'));
  });

  test('sever error', async () => {
    github.rest.repos.deleteRelease.mockImplementationOnce(() => {
      return {
        status: 500
      };
    });

    await expect(tagUpdater.deleteRelease(github, context))
    .rejects
    .toThrow(new Error('Unexpected status code returned when deleting the release: 500'));
  });
});

describe('deleteTag', () => {
  let github = {
    rest: {
      git: {
        deleteRef: jest.fn()
      }
    }
  };
  let context = {
    repo: {
      owner: undefined,
      repo: undefined
    }
  };

  test('successfully deleted', async () => {
    let tag = "test";
    github.rest.git.deleteRef.mockImplementationOnce(() => {
      return {
        status: 204
      };
    });

    let result = await tagUpdater.deleteTag(github, context, tag);
    expect(result).toStrictEqual(true);
  });

  test('not found', async () => {
    let tag = "test";
    github.rest.git.deleteRef.mockImplementationOnce(() => {
      let e = new Error("Not found");
      e.name = "HttpError";
      e.message = "Not Found";
      e.response = {
        status: 404
      };
      throw e;
    });

    let result = await tagUpdater.deleteTag(github, context, tag);
    expect(result).toStrictEqual(false);
  });

  test('unauthorized', async () => {
    let tag = "test";
    github.rest.git.deleteRef.mockImplementationOnce(() => {
      let e = new Error("Unauthorized");
      e.name = "HttpError";
      e.message = "Unauthorized";
      e.response = {
        status: 401
      };
      throw e;
    });

    await expect(tagUpdater.deleteTag(github, context, tag))
    .rejects
    .toThrow(new Error('Unauthorized'));
  });

  test('sever error', async () => {
    let tag = "test";
    github.rest.git.deleteRef.mockImplementationOnce(() => {
      return {
        status: 500
      };
    });

    await expect(tagUpdater.deleteTag(github, context, tag))
    .rejects
    .toThrow(new Error('Unexpected status code returned when deleting the tag: 500'));
  });
});