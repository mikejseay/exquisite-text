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
import { MenuButtons } from "../../components/MenuButtons";
import { requestJoinAsEditor, requestJoinAsSpectator } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";

export default function Join() {

    const { joinErrorMessage, setRoomCode } = useSocketInfo();

    const { id } = useParams();

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
        requestJoinAsEditor(roomId, name);
        setRoomCode(roomId.toUpperCase());
    };

    const handleSpectatePress = () => {
        requestJoinAsSpectator(roomId, name);
        setRoomCode(roomId.toUpperCase());
    };

    React.useEffect(() => {
        setIsRoomValid(roomId.length === roomCodeLength);
        setIsNameValid(name.length > 0);
    }, [ id, name, roomId ]);

    React.useEffect(() => {
        setRoomId(id ?? "");
    }, [ id ]);

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
        </div>
    );
}
