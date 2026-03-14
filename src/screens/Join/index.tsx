import * as React from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {
    maxNameChars,
    roomCodeLength,
} from "../../constants";
import { emitJoinAs } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { Role } from "../../types";

export default function Join() {

    const { joinErrorMessage, setRoomCode } = useSocketInfo();

    const { id } = useParams();

    const [ roomID, setRoomID ] = React.useState<string>(id ?? "");
    const [ name, setName ] = React.useState<string>("");

    const [ isRoomValid, setIsRoomValid ] = React.useState<boolean>(false);
    const [ isNameValid, setIsNameValid ] = React.useState<boolean>(false);

    const handleRoomEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRoomID(event.target.value);
        setIsRoomValid(event.target.value.length === roomCodeLength);
    };

    const handleNameEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        setIsNameValid(event.target.value.length > 0);
    };

    const handlePlayPress = () => {
        emitJoinAs(roomID, name, Role.EDITOR);
        setRoomCode(roomID.toUpperCase());
    };

    const handleSpectatePress = () => {
        emitJoinAs(roomID, name, Role.SPECTATOR);
        setRoomCode(roomID.toUpperCase());
    };

    React.useEffect(() => {
        setIsRoomValid(roomID.length === roomCodeLength);
        setIsNameValid(name.length > 0);
    }, [ id, name, roomID ]);

    React.useEffect(() => {
        setRoomID(id ?? "");
    }, [ id ]);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(1em, 8vh, 6em)" }}>
                <Box
                    autoComplete="off"
                    component="form"
                    noValidate
                    sx={{
                        "& > :not(style)": { m: 1, width: "25ch" },
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: "1em",
                    }}
                >
                    <TextField
                        inputProps={{ maxLength: roomCodeLength, style: { textTransform: "uppercase" } }}
                        label={`Enter ${String(roomCodeLength)}-Letter Code`}
                        onChange={handleRoomEntryChange}
                        required
                        value={roomID}
                        variant="standard"
                    />
                    <TextField
                        inputProps={{ maxLength: maxNameChars, style: { textTransform: "uppercase" } }}
                        label="Enter Your Name"
                        onChange={handleNameEntryChange}
                        required
                        value={name}
                        variant="standard"
                    />
                </Box>
            </div>
            <Stack
                spacing={2}
                direction="row"
                style={{ justifyContent: "center" }}
            >
                <Button
                    disabled={!(isRoomValid && isNameValid)}
                    onClick={handlePlayPress}
                    variant="contained"
                >
          Play
                </Button>
                <Button
                    disabled={!(isRoomValid && isNameValid)}
                    onClick={handleSpectatePress}
                    variant="outlined"
                >
          Spectate
                </Button>
            </Stack>
            <div
                className={"joinErrorMessage"}
                style={{
                    color: "red",
                    marginTop: "1em",
                    textAlign: "center",
                }}>
                {joinErrorMessage}
            </div>
        </div>
    );
}
