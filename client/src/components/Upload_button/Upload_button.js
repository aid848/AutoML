import React from "react";
import { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import * as XLSX from "xlsx";
//import DataTable from "react-data-table-component";
import "./Upload_button.css";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import TextField from "@material-ui/core/TextField";
import { useSelector } from "react-redux";
import MenuItem from "@material-ui/core/MenuItem";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: "none",
  },
}));

export default function UploadButtons() {
  const login_token = useSelector((state) => state.loginReducer);
  const [selectedFile, setFile] = useState(null);
  const [values, setValues] = useState({
    response: "",
    post: "",
    responseToPost: "",
    target_col: "",
    guest: login_token.isGuest,
  });

  const [columns, setColumns] = useState([]);
  // const [data, setData] = useState([]);

  // process CSV data
  const processData = (dataString) => {
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(
      /,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/
    );

    const list = [];
    for (let i = 1; i < dataStringLines.length; i++) {
      const row = dataStringLines[i].split(
        /,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/
      );
      if (headers && row.length == headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] == '"') d = d.substring(1, d.length - 1);
            if (d[d.length - 1] == '"') d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }

        // remove the blank rows
        if (Object.values(obj).filter((x) => x).length > 0) {
          list.push(obj);
        }
      }
    }

    // prepare columns list from headers
    const columns = headers.map((c) => ({
      name: c,
      selector: c,
    }));

    //setData(list);
    setColumns(columns);
  };

  // handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFile(file);

    const data = new FormData();
    data.append("file", selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      /* Parse data */
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });
      processData(data);
    };
    reader.readAsBinaryString(file);
  };

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <input
        accept=".csv,.xlsx,.xls"
        className={classes.input}
        id="contained-button-file"
        multiple
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="contained-button-file">
        <Button
          variant="contained"
          color="primary"
          component="span"
          startIcon={<CloudUploadIcon />}
        >
          Upload File
        </Button>
      </label>
      <p>
        {columns.length != 0 ? (
          <TextField
            id="target_col"
            select
            label="Select target column"
            value={values.target_col}
            onChange={(e) =>
              setValues({
                ...values,
                target_col: e.target.value,
              })
            }
            helperText="Please select target column"
          >
            {columns.map((option) => (
              <MenuItem key={option.selector} value={option.selector}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          ""
        )}
      </p>

      {/* <DataTable pagination highlightOnHover columns={columns} data={data} /> */}
    </div>
  );
}
