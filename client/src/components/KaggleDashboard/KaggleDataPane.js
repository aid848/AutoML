import { React } from "react";
import { useSelector } from "react-redux";
import { compType, dataType } from "./kaggleApi";
import { List, ListItem } from "@material-ui/core";
import KaggleDataEntry from "./KaggleDataEntry";

const KaggleDataPane = () => {
  let files = useSelector((state) => state.kaggleReducer.files);
  let Formatted = null;

  const handleIncommingFiles = (files) => {
    if (files.type === dataType) {
      return handleDatasetFiles(files.data.datasetFiles);
    } else if (files.type === compType) {
      return handleCompetitionFiles(files.data);
    }
  };

  const handleDatasetFiles = (data) => {
    let entries = [];
    for (let [i, entry] of data.entries()) {
      entries.push(
        <KaggleDataEntry key={i} id={i} text={entry.name} type={dataType} />
      );
    }
    return entries;
  };

  const handleCompetitionFiles = (data) => {
    // todo format into list entry
    // todo format into folder structure
    let entries = [];
    for (let [i, entry] of data.entries()) {
      entries.push(
        <ListItem
          button
          onClick={(e) => console.log(e)}
          selected={false}
          id={i}
        >
          {entry.name}
        </ListItem>
      );
    }
    return entries;
  };

  if (files) {
    Formatted = <List>{handleIncommingFiles(files)}</List>;
  }

  return (
    <div className="KagglePanel">
      <h4>Supported Data Files:</h4>
      {Formatted}
    </div>
  );
};

export default KaggleDataPane;
