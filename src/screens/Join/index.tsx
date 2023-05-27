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
    const [ roomId, setRoomId ] = React.useState<string>(id ?? "");
    const [ name, setName ] = React.useState<string>("");

    const [ isRoomValid, setIsRoomValid ] = React.useState<boolean>(false);
    const [ isNameValid, setIsNameValid ] = React.useState<boolean>(false);

    const handleRoomEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRoomId(event.target.value);
        setIsRoomValid(event.target.value.length === roomCodeLength);
    };

    const handleNameEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        setIsNameValid(event.target.value.length > 0);
    };

    const handleWritePress = () => {
        socket.emit("joinGameAs", "Editor", roomId.toUpperCase(), name.toUpperCase());
    };

    const handleSpectatePress = () => {
        socket.emit("joinGameAs", "Spectator", roomId.toUpperCase(), name.toUpperCase());
    };

    React.useEffect(() => {
        setIsRoomValid(roomId.length === roomCodeLength);
        setIsNameValid(name.length > 0);
    }, [ id, name, roomId ]);

    React.useEffect(() => {
        setRoomId(id ?? "");
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
                        value={roomId}
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
                    onClick={handleWritePress}
                    variant="contained"
                >
          Write
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
            <MenuButtons socket={socket} />
        </div>
    );
}
