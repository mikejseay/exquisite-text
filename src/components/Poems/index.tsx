import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import * as React from "react";

import { useSocket } from "../App";
import {
  poemsBody,
  poemFont,
  poemTitle,
} from "./styles";

import {
  IPoem,
  IPoems,
} from "../../types";

function Poems() {
  const { socket } = useSocket();
  // The poems state is a plain object that contains each poem indexed by the poem ID.
  // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
  const [poems, setPoems] = React.useState<IPoems>({} as IPoems);

  React.useEffect(() => {
    // Event handlers for the poem and the deletePoem events are set up for the Socket.IO connection.
    const poemListener = (poem: IPoem) => {
      setPoems((prevPoems) => {
        const newPoems = { ...prevPoems };
        newPoems[poem.id] = poem;
        return newPoems;
      });
    };

    socket.on("poem", poemListener);

    // tells the server for this client to do getPoems
    // since this is client-side, it only happens for this client
    socket.emit("getPoems");

    return () => {
      socket.off("poem", poemListener);
    };
  }, [socket]);

  return (
    // The component then displays all poems sorted by the timestamp at which they were created.
    // we can switch this so that it renders previous poems according to a view
    <div style={poemsBody}>
      {[...Object.values(poems)]
        .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
        .map((poem) => (
          <div key={poem.id} className="poem-container">
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <div style={poemTitle} className={"poem-title"}>
                  <strong>{poem.title}</strong>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div
                  className={"poem"}
                  style={poemFont}
                >
                  {poem.content}
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        ))}
    </div>
  );
}

export default Poems;
