import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import {
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  Grid,
  InputLabel,
  FormControl,
  MenuItem,
  CircularProgress,
  Tooltip,
  ButtonGroup,
  Typography,
  DialogActions,
  Collapse,
} from "@material-ui/core";
import {
  CloudDownload,
  AddCircle,
  CloudUpload,
  ViewList,
  ExpandMore,
  ExpandLess,
} from "@material-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  competitionAuth,
  compType,
  userJobItems,
  sourceRef,
  fileDownload,
  getColumnDownloadMethod,
  getSubmissions,
} from "./kaggleApi";
import axios from "axios";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";
import {
  setKJobs,
  set_loading,
  set_checked,
  setKaggleSuccess,
} from "../../redux/actions/actions";
import KagglePredictDialog from "./KagglePredictDialog";

const useStyles = makeStyles(() => ({
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "75%",
    bottom: "25%",
    left: "58%",
    right: "32%",
  },
  buttonProgressPredict: {
    color: green[500],
    position: "absolute",
    top: "35%",
    bottom: "65%",
    left: "35%",
    right: "65%",
  },
  buttonSuccess: {
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
  buttonFail: {
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}));

const KaggleActionPane = (props) => {
  const classes = useStyles();
  let files = useSelector((state) => state.kaggleReducer.files);
  let datafile = useSelector((state) => state.kaggleReducer.dataFile);
  let source = useSelector((state) => state.kaggleReducer.source);
  let competitions = useSelector((state) => state.kaggleReducer.competitions);
  let datasets = useSelector((state) => state.kaggleReducer.datasets);
  let email = useSelector((state) => state.loginReducer.email);
  let token = useSelector((state) => state.loginReducer.accessToken);
  let jobs = useSelector((state) => state.kaggleReducer.kjobs);
  let SET_SRCINFO = useSelector((state) => state.kaggleReducer.SET_SRCINFO);
  const [jobOpen, setJobOpen] = useState(false);
  const [time, setTime] = useState(5);
  const [nickname, setNickname] = useState("");
  const [target, setTarget] = useState("");
  const [submittingJob, setSubmittingJob] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fail, setFail] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [selectJob, setSelectJob] = useState({});
  const [offboard, setOffboard] = useState(false);
  const [columnElement, setColumnElement] = useState(null);
  const [retrainOpen, setRetrainOpen] = useState(false);
  const [submitterOpen, setSubmitterOpen] = useState(false);
  const [predictCanClose, setPredictCanClose] = useState(true);
  const [descOpen, setDescOpen] = useState(false);
  let dispatch = useDispatch();
  const login_token = useSelector((state) => state.loginReducer);

  KaggleActionPane.propTypes = {
    tab: PropTypes.number.isRequired,
    setTab: PropTypes.func.isRequired,
  };

  const buttonClassname = clsx({
    [classes.buttonSuccess]: success,
    [classes.buttonFail]: fail,
  });

  useEffect(() => {
    return () => {
      setDescOpen(false);
    };
  }, []);

  const fileRef = () => {
    if (!datafile) {
      return null;
    } else if (datafile.mode === "COMPETITION") {
      return files.data[datafile.index];
    } else {
      return files.data.datasetFiles[datafile.index];
    }
  };

  // TODO refactor this into multiple pieces, move some to kaggleapi
  const handleDownload = (download) => {
    let file = fileRef();
    let url = "";
    if (file) {
      return new Promise((resolve) => {
        if (datafile.mode === "COMPETITION") {
          competitionAuth(competitions[+source.index].ref, email).then(
            (entered) => {
              if (entered === false) {
                setOffboard(true);
              } else {
                url = `/competitions/data/download/${
                  competitions[+source.index].ref
                }/${file.name}`;
                if (download) {
                  fileDownload(url, file, token, email);
                }
                resolve(url);
              }
            }
          );
        } else {
          url = `/datasets/download/${file.datasetRef}/${file.name}`;
          if (download) {
            fileDownload(url, file, token, email);
          }
          resolve(url);
        }
      });
    }
  };

  const createJob = () => {
    setFail(false);
    setSuccess(false);
    setTime(5);
    dispatch(set_loading(true));
    setTarget("");
    if (datafile.mode === "COMPETITION") {
      competitionAuth(competitions[+source.index].ref, email).then(
        (entered) => {
          if (entered === true) {
            TargetColumn().then((col) => {
              setJobOpen(true);
              setColumnElement(col);
            });
          } else {
            dispatch(set_loading(false));
            setOffboard(true);
          }
        }
      );
    } else {
      TargetColumn().then((col) => {
        setColumnElement(col);
        setJobOpen(true);
      });
    }
  };

  // eslint-disable-next-line no-unused-vars
  const retrainJob = () => {
    setFail(false);
    setSuccess(false);
    setTime(5);
    dispatch(set_loading(true));
    setTarget("");
    if (datafile.mode === "COMPETITION") {
      competitionAuth(competitions[+source.index].ref, email).then(
        (entered) => {
          if (entered === true) {
            TargetColumn().then((col) => {
              setRetrainOpen(true);
              setColumnElement(col);
            });
          } else {
            dispatch(set_loading(false));
            setRetrainOpen(true);
          }
        }
      );
    } else {
      TargetColumn().then((col) => {
        setColumnElement(col);
        setRetrainOpen(true);
      });
    }
  };

  const createPredict = () => {
    setFail(false);
    setSelectJob(null);
    setSuccess(false);
    if (datafile.mode === "COMPETITION") {
      competitionAuth(competitions[+source.index].ref, email).then(
        (entered) => {
          if (entered === true) {
            setPredictOpen(true);
          } else {
            setOffboard(true);
          }
        }
      );
    } else {
      setPredictOpen(true);
    }
  };

  const getColumns = () => {
    return new Promise((resolve) => {
      let col = [];
      if (fileRef() && fileRef().columns) {
        let ref = fileRef().columns;
        ref.forEach((ele) => {
          col.push(ele.name);
        });
      }
      if (datafile && col.length === 0) {
        // try to get columns via alternate method
        getColumnDownloadMethod(email, token, handleDownload, col).then(
          (cols) => {
            resolve(cols);
          }
        );
      } else {
        resolve(col);
      }
    });
  };

  const handleColumn = (txt) => {
    setTarget(txt);
  };

  const handleNickname = (txt) => {
    setNickname(txt);
  };

  const handleSearchTime = (val) => {
    setTime(val);
  };

  const TargetColumn = () => {
    return getColumns().then((col) => {
      dispatch(set_loading(false));
      if (col.length > 0) {
        setTarget(col[0]);
        let options = col.map((ele, i) => {
          return (
            <MenuItem key={i} value={ele}>
              {ele}
            </MenuItem>
          );
        });
        return (
          <FormControl>
            <InputLabel>Target Column</InputLabel>
            <Select // controlled select is broken when it shouldn't be
              // value={() => target || ""}
              defaultValue={() => {
                if (options && options.length >= 1) {
                  return options[0].props.value;
                }
              }}
              onChange={(e) => handleColumn(e.target.value)}
              required
            >
              {options}
            </Select>
          </FormControl>
        );
      } else {
        return (
          <div>
            <TextField
              required
              onChange={(e) => handleColumn(e.target.value)}
              label={"Target Column"}
              title="Unable to automatically detect columns"
            ></TextField>{" "}
          </div>
        );
      }
    });
  };

  const handleEnqueue = (e) => {
    e.preventDefault();
    setSuccess(false);
    setFail(false);
    setSubmittingJob(true);
    let sourceType = datafile ? datafile.mode : "invalid";
    axios
      .get("/api/user", { params: { email: email } })
      .then((user) => {
        let id = user.data.data.id;
        handleDownload().then((src) => {
          axios
            .post(`/api/kaggle/${id}/job`, {
              status: "CREATED",
              targetColumnName: target,
              name: nickname,
              durationLimit: time,
              kaggleSrc: src,
              kaggleType: sourceType,
              kaggleId: sourceRef(source, datasets, competitions),
            })
            .then((res) => {
              if (res.status === 201) {
                setSuccess(true);
                setJobOpen(false);
                dispatch(setKaggleSuccess(true));
                setTimeout(() => {
                  props.setTab(0);
                  dispatch(setKaggleSuccess(false));
                }, 2000);
              } else {
                setFail(true);
              }
              setSubmittingJob(false);
            })
            .catch(() => {
              setFail(true);
              setSubmittingJob(false);
            });
        });
      })
      .catch(() => {
        setFail(true);
        setSubmittingJob(false);
      });
  };

  const handlePredict = (e) => {
    e.preventDefault();
    setSuccess(false);
    setFail(false);
    setSubmittingJob(true);
    let sourceType = datafile ? datafile.mode : "invalid";

    axios
      .get("/api/user", { params: { email: email } })
      .then((user) => {
        let id = user.data.data.id;
        handleDownload()
          .then((src) => {
            axios
              .post(`/api/kaggle/${id}/predict`, {
                job: selectJob,
                kaggleSrc: src,
                kaggleType: sourceType,
                kaggleId: sourceRef(source, datasets, competitions),
              })
              .then((res) => {
                if (res.status === 201) {
                  setSuccess(true);
                  setPredictOpen(false);
                  dispatch(setKaggleSuccess(true));
                  setTimeout(() => {
                    dispatch(setKaggleSuccess(false));
                    props.setTab(0);
                    setSubmittingJob(false);
                  }, 2000);
                } else {
                  setFail(true);
                  setSubmittingJob(false);
                }
              })
              .catch(() => {
                setFail(true);
                setSubmittingJob(false);
              });
          })
          .catch(() => {
            setFail(true);
            setSubmittingJob(false);
          });
      })
      .catch(() => {
        setFail(true);
        setSubmittingJob(false);
      });
  };

  const handleRetrain = (e) => {
    console.log(e);
  };

  const jobAssociated = () => {
    if (jobs) {
      let job = jobs.find((ele) => ele.props.value === selectJob);
      if (
        job &&
        job.props &&
        job.props["data-my-value"] &&
        job.props["data-my-value"].kaggleId &&
        job.props["data-my-value"].kaggleType
      ) {
        return `Source: ${job.props["data-my-value"].kaggleId} (${job.props["data-my-value"].kaggleType})`;
      } else {
        return "No associated Kaggle Source";
      }
    }
    return "";
  };

  const offboardToKaggle = () => {
    try {
      let url = competitions[source.index].url;
      if (url) {
        const kaggleWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (kaggleWindow) kaggleWindow.opener = null;
      }
    } catch (e) {
      // TODO error
      console.log(e);
    }
  };

  const handleSelectJob = (txt) => {
    setSelectJob(txt);
  };

  return (
    <div className="KagglePanel">
      <Dialog
        open={jobOpen}
        onClose={() => {
          if (!submittingJob) {
            setJobOpen(false);
          }
        }}
      >
        <DialogTitle>Create Job</DialogTitle>
        <DialogContent>
          <form onSubmit={(e) => handleEnqueue(e)}>
            <Grid container spacing={0}>
              <Grid item xs={6}>
                {columnElement}
              </Grid>
              <br />
              <Grid item xs={6}>
                <TextField
                  required
                  onChange={(e) => handleNickname(e.target.value)}
                  label="Job nickname"
                ></TextField>
              </Grid>
              <Grid item xs={6}>
                <br />
                <FormControl>
                  <InputLabel>Search Time Limit</InputLabel>
                  <Select
                    onChange={(e) => handleSearchTime(e.target.value)}
                    value={time}
                  >
                    <MenuItem value={5}>5 minutes</MenuItem>
                    <MenuItem value={20}>20 minutes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <br />
                <Tooltip
                  open={true}
                  title={fail ? "Failed to submit job." : ""}
                  placement="right"
                >
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={submittingJob}
                    className={buttonClassname}
                  >
                    Queue Job
                  </Button>
                </Tooltip>
                {submittingJob && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={retrainOpen} onClose={() => setRetrainOpen(false)}>
        <DialogTitle>Retrian Existing Job</DialogTitle>
        <DialogContent>
          <form onSubmit={(e) => handleRetrain(e)}>
            <Grid container spacing={0}>
              <Grid item xs={6}>
                {columnElement}
              </Grid>
              <br />
              <Grid item xs={6}>
                <InputLabel>Available Trained Jobs</InputLabel>
                <Select
                  onChange={(e) => handleSelectJob(e.target.value)}
                  value={selectJob}
                  required
                >
                  {jobs}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <br />
                <FormControl>
                  <InputLabel>Search Time Limit</InputLabel>
                  <Select
                    onChange={(e) => handleSearchTime(e.target.value)}
                    value={time}
                  >
                    <MenuItem value={5}>5 minutes</MenuItem>
                    <MenuItem value={20}>20 minutes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <br />
                <Tooltip
                  open={true}
                  title={fail ? "Failed to submit job." : ""}
                  placement="right"
                >
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={submittingJob}
                    className={buttonClassname}
                  >
                    Retrain
                  </Button>
                </Tooltip>
                {submittingJob && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={predictOpen}
        onClose={() => {
          if (!submittingJob) {
            setPredictOpen(false);
          }
        }}
      >
        <DialogTitle>Submit Test File for Automatic Classification</DialogTitle>
        <DialogContent>
          <form onSubmit={(e) => handlePredict(e)}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <InputLabel>Available Trained Jobs</InputLabel>
                {!submittingJob && (
                  <div>
                    <Select
                      onChange={(e) => handleSelectJob(e.target.value)}
                      value={selectJob}
                      required
                    >
                      {jobs}
                    </Select>
                    <br />
                    {selectJob && selectJob !== {} && jobAssociated()}
                  </div>
                )}
              </Grid>
              <Grid item xs={6}>
                <Tooltip
                  open={true}
                  title={fail ? "Failed to submit prediction file" : ""}
                  placement="right"
                >
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={submittingJob}
                    className={buttonClassname}
                  >
                    Predict
                    {submittingJob && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgressPredict}
                      />
                    )}
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </form>
          <br />
        </DialogContent>
      </Dialog>
      <Paper>
        <h2 className="KagglePanelHeader">Available Actions</h2>
        <Button
          style={{ display: "block", width: "100%" }}
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => {
            dispatch(set_checked([]));
            dispatch(set_loading(true));
            userJobItems(email, login_token).then((entries) => {
              dispatch(setKJobs(entries));
              setPredictCanClose(true);
              dispatch(set_loading(false));
              setSubmitterOpen(true);
            });
          }}
        >
          Upload Prediction as new dataset version
        </Button>
        {files && (
          <ButtonGroup style={{ width: "100%" }}>
            {files.type === compType && (
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                style={{ display: "block", width: "50%" }}
                onClick={() => {
                  competitionAuth(competitions[+source.index].ref, email).then(
                    (entered) => {
                      if (entered === true) {
                        dispatch(set_checked([]));
                        dispatch(set_loading(true));
                        userJobItems(email, login_token).then((entries) => {
                          dispatch(setKJobs(entries));
                          dispatch(set_loading(false));
                          setSubmitterOpen(true);
                        });
                      } else {
                        setOffboard(true);
                      }
                    }
                  );
                }}
              >
                Submit Prediction
              </Button>
            )}
            {files.type === compType && (
              <Button
                variant="contained"
                startIcon={<ViewList />}
                style={{ width: "50%" }}
                onClick={() => {
                  competitionAuth(competitions[+source.index].ref, email).then(
                    (entered) => {
                      if (entered === true) {
                        getSubmissions(
                          email,
                          sourceRef(source, datasets, competitions)
                        ).then((res) => {
                          console.log(res);
                          // TODO
                        });
                      } else {
                        setOffboard(true);
                      }
                    }
                  );
                }}
              >
                {" "}
                Previous Submissions
              </Button>
            )}
          </ButtonGroup>
        )}
        {files && files.type === compType && (
          <p>
            Unable to determine license for competitions, please abide by the
            competition rules.
          </p>
        )}
        {SET_SRCINFO && SET_SRCINFO.ownerName && (
          <p>Dataset Owner: {SET_SRCINFO.ownerName}</p>
        )}
        {SET_SRCINFO && SET_SRCINFO.licenseName && (
          <p>License: {SET_SRCINFO.licenseName}</p>
        )}
        {SET_SRCINFO && SET_SRCINFO.usabilityRating && (
          <p>Usability Rating: {SET_SRCINFO.usabilityRating}</p>
        )}

        {datafile && (
          <div>
            <p>
              File Description:{" "}
              {fileRef().description && fileRef().description.trim() !== ""
                ? fileRef().description
                : "(none)"}
            </p>
            <h5>File Size: {fileRef().totalBytes} bytes</h5>
            <Tooltip
              title={"Limited to CSV files"}
              placement="bottom"
              disableFocusListener={datafile.accepted}
              disableHoverListener={datafile.accepted}
              disableTouchListener={datafile.accepted}
            >
              <ButtonGroup
                size="medium"
                color="primary"
                aria-label="medium contained button group"
                fullWidth={true}
                variant="contained"
              >
                <Button
                  startIcon={<CloudDownload />}
                  onClick={() => handleDownload(true)}
                  disabled={!datafile.accepted}
                >
                  Download File
                </Button>
                <Button
                  startIcon={<AddCircle />}
                  onClick={() => createJob()}
                  disabled={!datafile.accepted}
                >
                  Create Training Job
                </Button>
                {/* <Button
                  startIcon={<AddCircle />}
                  onClick={() => {
                    userJobItems(email, login_token).then((entries) =>
                      dispatch(setKJobs(entries))
                    );
                    retrainJob();
                  }}
                  disabled={true}
                >
                  Retrain Existing Job
                </Button> */}
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => {
                    userJobItems(email, login_token).then((entries) => {
                      dispatch(setKJobs(entries));
                      createPredict();
                    });
                  }}
                  disabled={!datafile.accepted}
                >
                  Auto Classify
                </Button>
              </ButtonGroup>
            </Tooltip>
          </div>
        )}
        {SET_SRCINFO && SET_SRCINFO.description && (
          <div>
            <Button
              endIcon={descOpen ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setDescOpen(!descOpen)}
              style={{ display: "block", width: "100%" }}
            >
              Dataset Description
            </Button>
            <Collapse in={descOpen} timeout="auto" unmountOnExit>
              <ReactMarkdown>{SET_SRCINFO.description}</ReactMarkdown>
            </Collapse>
          </div>
        )}
      </Paper>
      <Dialog open={offboard} onClose={() => setOffboard(false)}>
        <DialogTitle gutterBottom variant="h5" component="h2">
          You must accept the competition rules
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" component="p">
                Unfortunately, due to Kaggle’s policies, you must read and
                accept the competition rules to access these files.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            color="primary"
            variant="contained"
            onClick={() => offboardToKaggle()}
          >
            Open competition page
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={submitterOpen}
        onClose={() => {
          if (predictCanClose) {
            setSubmitterOpen(false);
          }
        }}
        fullWidth
        maxWidth="lg"
        style={{ minHeight: "40vh" }}
      >
        <KagglePredictDialog
          open={submitterOpen}
          setOpen={setSubmitterOpen}
          setPredictCanClose={setPredictCanClose}
          setTab={props.setTab}
        />
      </Dialog>
    </div>
  );
};

export default KaggleActionPane;
