import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useSocket } from "../components/App";

export default function Join() {
  const navigate = useNavigate();
  const roomCodeLength = 4;
  const maxNameLength = 13;

  const { socket } = useSocket();

  const [joinErrorMessage, setJoinErrorMessage] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [roomOK, setRoomOK] = useState<boolean>(false);
  const [nameOK, setNameOK] = useState<boolean>(false);

  const handleRoomEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoom(event.target.value);
    setRoomOK(event.target.value.length === roomCodeLength)
  };

  const handleNameEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setNameOK(event.target.value.length > 0)
  };

  const handleWritePress = () => {
    socket.emit("joinGameEditor", room.toUpperCase(), name.toUpperCase());
  };

  const handleSpectatePress = () => {
    socket.emit("joinGameSpectator", room.toUpperCase(), name.toUpperCase());
  };

  useEffect(() => {
    const joinErrorListener = (errorMsg: string) => {
      setJoinErrorMessage(errorMsg);
      setTimeout(() => setJoinErrorMessage(""), 3000);
    };

    const editorJoinSuccessListener = () => {
      console.log("editorJoinSuccess happened");
      // send to lobby
      navigate("/lobby");
    };

    const spectatorJoinSuccessListener = () => {
      console.log("spectatorJoinSuccess happened");
      // send to lobby
      navigate("/lobby");
    };

    socket.on("joinError", joinErrorListener);
    socket.on("editorJoinSuccess", editorJoinSuccessListener);
    socket.on("spectatorJoinSuccess", spectatorJoinSuccessListener);

    return () => {
      socket.off("joinError", joinErrorListener);
    };
  }, [socket]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Box
          component="form"
          sx={{
            "& > :not(style)": { m: 1, width: "25ch" },
            display: "flex",
            flexDirection: "column",
            marginBottom: "1em"
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            required
            label={"Enter " + roomCodeLength.toString() + "-Letter Code"}
            variant="standard"
            value={room}
            onChange={handleRoomEntryChange}
            inputProps={{ maxLength: roomCodeLength, style: { textTransform: "uppercase" } }}
          />
          <TextField
            required
            label="Enter Your Name"
            variant="standard"
            value={name}
            onChange={handleNameEntryChange}
            inputProps={{ maxLength: maxNameLength, style: { textTransform: "uppercase" } }}
          />
        </Box>
      </div>
      <Stack
        spacing={2}
        direction="row"
        style={{ justifyContent: "center" }}
      >
        <Button
          disabled={!(roomOK && nameOK)}
          onClick={handleWritePress}
          variant="contained"
        >
          Write
        </Button>
        <Button
          disabled={!(roomOK && nameOK)}
          onClick={handleSpectatePress}
          variant="outlined"
        >
          Spectate
        </Button>
      </Stack>
      <div className={"joinErrorMessage"} style={{ color: "red", textAlign: "center", marginTop: "1em" }}>
        {joinErrorMessage}
      </div>
    </div>
  );
}
