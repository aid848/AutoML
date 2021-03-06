const User = require("../models/user-model");
const jwt = require("jsonwebtoken");
const { secret } = require("../util/security");
const fs = require("fs");
let { PythonShell } = require("python-shell");

verifyToken = (req, res, next) => {
  if (
    !req.headers.authorization ||
    req.headers.authorization.split(" ").length < 2
  ) {
    return res.status(403).send({ message: "No token provided!" });
  }

  let token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req._id = decoded._id;
    next();
  });
};

addJobToUser = async (userId, job) => {
  return User.findByIdAndUpdate(
    userId,
    { $addToSet: { jobs: job._id } },
    { new: true, useFindAndModify: false }
  );
};

uploadFileToServer = async (id, fileData, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      let path = `./util/${id}-${fileName}`;
      fs.writeFileSync(path, fileData);

      let options = {
        args: [path, id, fileName],
        env: {
          ...process.env,
        },
      };

      PythonShell.run(
        "./util/run_upload_new.py",
        options,
        function (err, results1) {
          if (err) {
            reject(err);
          }
          fs.unlinkSync(path);
          resolve(results1);
        }
      );
    } catch (e) {
      try {
        fs.unlinkSync(`./util/${id}-${fileName}`);
      } catch (ee) {
        console.log(ee);
      }
      reject(e);
    }
  });
};

runPhase = async (
  fullFilePath,
  jobId,
  durationLimit,
  targetColumnName,
  email,
  jobName,
  callbackUrl,
  isTrainPhase
) => {
  let options = {
    args: [
      fullFilePath,
      jobId,
      durationLimit,
      targetColumnName,
      email,
      jobName,
      callbackUrl,
    ],
    env: {
      ...process.env,
    },
  };
  return new Promise((resolve, reject) => {
    try {
      PythonShell.run(
        `./util/run_${isTrainPhase ? "train.py" : "predict.py"}`,
        options,
        function (err, results1) {
          if (err) {
            resolve(err);
          }
          resolve(results1);
        }
      );
    } catch (err) {
      reject("error running python code'");
    }
  });
};

getPredFileNames = (id) => {
  let options = {
    args: [id],
    env: {
      ...process.env,
    },
  };

  return new Promise((resolve, reject) => {
    try {
      PythonShell.run(
        "./util/run_getPredictions.py",
        options,
        function (err, results1) {
          if (err) {
            resolve(err);
          }
          resolve(results1);
        }
      );
    } catch {
      reject("error running python code'");
    }
  });
};

getPredFileText = (id, name, path, cols) => {
  let options = {
    args: [path, id, name, JSON.stringify({ columns: cols })],
    env: {
      ...process.env,
    },
  };

  return new Promise((resolve, reject) => {
    try {
      PythonShell.run(
        "./util/run_getPredictionFile.py",
        options,
        function (err, results1) {
          if (err) {
            reject(err);
          }
          console.log(results1);
          resolve(results1);
        }
      );
    } catch (err) {
      console.log(err);
      reject("error running python code'");
    }
  });
};

getPredErrorOutputFileText = (id, path, fileName) => {
  let options = {
    args: [path, id, fileName],
    env: {
      ...process.env,
    },
  };

  return new Promise((resolve, reject) => {
    try {
      PythonShell.run(
        "./util/run_getErrorOutFile.py",
        options,
        function (err, results1) {
          if (err) {
            reject(err);
          }
          if (results1.toString().includes("[Errno 2] No such file")) {
            reject(fileName + ": not found");
          }
          resolve(results1);
        }
      );
    } catch (err) {
      console.log(err);
      reject("error running python code'");
    }
  });
};

checkJobUsers = (job, userID) => {
  if (job.users) {
    let found = false;
    job.users.forEach((user) => {
      if (user.toString() === userID.toString()) {
        found = true;
      }
    });
    return found;
  } else {
    return false;
  }
};

module.exports = {
  verifyToken,
  addJobToUser,
  uploadFileToServer,
  runPhase,
  getPredFileNames,
  getPredFileText,
  getPredErrorOutputFileText,
  checkJobUsers,
};
