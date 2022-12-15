import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useSocket } from "../../components/App";
import {
    maxNameChars,
    roomCodeLength,
    shortDur,
} from "../../constants";
import { MenuButtons } from "../../components/MenuButtons";

export default function Join() {
    const navigate = useNavigate();
    const { id } = useParams();

    const { socket } = useSocket();

    const [ joinErrorMessage, setJoinErrorMessage ] = React.useState<string>("");
    const [ roomID, setRoomID ] = React.useState<string>(id ?? "");
    const [ name, setName ] = React.useState<string>("");

    const [ roomOK, setRoomOK ] = React.useState<boolean>(false);
    const [ nameOK, setNameOK ] = React.useState<boolean>(false);

    const handleRoomEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRoomID(event.target.value);
        setRoomOK(event.target.value.length === roomCodeLength);
    };

    const handleNameEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        setNameOK(event.target.value.length > 0);
    };

    const handleWritePress = () => {
        socket.emit("joinGameAs", "Editor", roomID.toUpperCase(), name.toUpperCase());
    };

    const handleSpectatePress = () => {
        socket.emit("joinGameAs", "Spectator", roomID.toUpperCase(), name.toUpperCase());
    };

    React.useEffect(() => {
        setRoomOK(roomID.length === roomCodeLength);
        setNameOK(name.length > 0);
    }, [ id, name, roomID ]);

    React.useEffect(() => {
        setRoomID(id ?? "");
    }, [ id ]);

    React.useEffect(() => {
        const joinErrorListener = (errorMsg: string) => {
            setJoinErrorMessage(errorMsg);
            setTimeout(() => setJoinErrorMessage(""), shortDur);
        };

        const navigateListener = (targetRoute: string) => {
            navigate(targetRoute);
        };

        socket.on("joinError", joinErrorListener);
        socket.on("navigate", navigateListener);

        return () => {
            socket.off("joinError", joinErrorListener);
            socket.off("navigate", navigateListener);
        };
    }, [
        navigate,
        socket,
    ]);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "6em" }}>
                <Box
                    component="form"
                    sx={{
                        "& > :not(style)": { m: 1, width: "25ch" },
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: "1em",
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField
                        required
                        label={`Enter ${String(roomCodeLength)}-letter code`}
                        variant="standard"
                        value={roomID}
                        onChange={handleRoomEntryChange}
                        inputProps={{ maxLength: roomCodeLength, style: { textTransform: "uppercase" } }}
                    />
                    <TextField
                        required
                        label="Enter your name"
                        variant="standard"
                        value={name}
                        onChange={handleNameEntryChange}
                        inputProps={{ maxLength: maxNameChars, style: { textTransform: "uppercase" } }}
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
            <div
                className={"joinErrorMessage"}
                style={{
                    color: "red",
                    marginTop: "1em",
                    textAlign: "center",
                }}>
                {joinErrorMessage}
            </div>
            <MenuButtons socket={socket} />
        </div>
    );
}
