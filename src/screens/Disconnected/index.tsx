import React from "react";

function Disconnected() {
  return (
    <div style={{textAlign: "center"}}>
      {"You connected from another tab, so I disconnected you here.\n" +
        "Sorry!"}
    </div>
  );
}

export default Disconnected;
