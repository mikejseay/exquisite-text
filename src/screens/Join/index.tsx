import * as React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useSocket } from "../../components/App";
import CreateGame from "../../components/CreateGame";

export default function Join() {
    const navigate = useNavigate();
    const roomCodeLength = 4;
    const maxNameLength = 13;

    const { socket } = useSocket();

    const [ joinErrorMessage, setJoinErrorMessage ] = React.useState<string>("");
    const [ roomID, setRoomID ] = React.useState<string>("");
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
        const joinErrorListener = (errorMsg: string) => {
            setJoinErrorMessage(errorMsg);
            setTimeout(() => setJoinErrorMessage(""), 3000);
        };

        const navigateListener = (targetRoute: string) => {
            console.log("received navigate message to", targetRoute);
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
            <div style={{ display: "flex", justifyContent: "center" }}>
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
                        label={"Enter " + roomCodeLength.toString() + "-Letter Code"}
                        variant="standard"
                        value={roomID}
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
            <div
                className={"joinErrorMessage"}
                style={{
                    color: "red",
                    marginTop: "1em",
                    textAlign: "center",
                }}>
                {joinErrorMessage}
            </div>
            <CreateGame />
        </div>
    );
}
