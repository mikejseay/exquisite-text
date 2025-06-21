import * as React from "react";
import PoemGameSettings from "../../components/PoemGameSettings";
import DrawingGameSettings from "../../components/DrawingGameSettings";
import LeaveButton from "../../components/LeaveButton";
import UserTable from "../../components/UserTable";
import RoomCode from "../../components/RoomCode";
import { Medium } from "../../types";
import Box from "@mui/material/Box";
import { useSocketInfo } from "../../context/SocketInfoProvider";

function Lobby() {
    const { medium } = useSocketInfo();

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                textAlign: "center",
            }}
        >
            <RoomCode />
            <UserTable />
            {medium === Medium.POETRY
                ? (
                    <PoemGameSettings />
                )
                : (
                    <DrawingGameSettings />
                )}
            <LeaveButton />
        </Box>
    );
}

export default Lobby;
