import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Modal from "@mui/material/Modal";
import { modalContent, modalTitle, tutorial } from "./styles";
import exampleGif from '../../assets/images/exquisiteExample.gif';

const Tutorial = () => {

  // check if the user's visited the page before
  const firstVisit = !localStorage.getItem('visited');
  if (firstVisit) {
    localStorage.setItem('visited', 'yes');
  }

  // if first visit, the help modal will be initially open
  const [helpOpen, setHelpOpen] = useState(firstVisit);
  const handleHelpOpen = () => setHelpOpen(true);
  const handleHelpClose = () => setHelpOpen(false);

  return (
    <div className={"tutorial"}>
      <IconButton aria-label="info" onClick={handleHelpOpen} size={"large"}>
        <InfoOutlinedIcon />
      </IconButton>
      <Modal
        open={helpOpen}
        onClose={handleHelpClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={tutorial}>
          <div style={modalTitle}>
            <strong>HOW TO PLAY</strong>
          </div>
          <div style={modalContent}>
            <p>Exquisite Text is a collaborative writing game.</p>
            <p>When it's your turn, you will write a snippet of poetry split across two lines.</p>
            <p>The first line is yours to complete: write until the underlined region is filled. This part will be kept
              secret.</p>
            <p>Then, press Return ⏎.</p>
            <p> </p>
            <img src={exampleGif} alt="Example"/>
            <p>On the second line, write a short fragment. The next player will see this part, so give them a "prompt" to carry onward!</p>
            <p>When you've written enough on the second line, press the "Pass Turn" button that will appear.</p>
            <p>Express your creativity! Give your collaborator a tricky prompt!</p>
            <p>If you feel the poem has been finished, press the 'Complete Poem' button.</p>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default Tutorial;
