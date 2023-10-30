import * as React from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";

function UserTable() {
    const { userInfo } = useSocketInfo();
    console.log("userInfo", userInfo);
    if (!userInfo) {
        return null;
    }
    const { editors, editorColors, spectators } = userInfo;
    console.log("editors", editors);
    console.log("editorColors", editors);
    console.log("spectators", editors);
    if (!editors) {
        return null;
    }
    if (!spectators) {
        return null;
    }

    // const { editors, editorColors, spectators } = userInfo;
    // console.log({ userInfo });

    return (
        <div className={"userTable"} style={{ textAlign: "center" }}>
            <div className={"editors"}>
                <h2>Editors:</h2>
                {editors.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex} style={{ color: editorColors[nameIndex] }}>{name}</p>
                    );
                })}
            </div>
            <div className={"spectators"}>
                <h2>Spectators:</h2>
                {spectators.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex}>{name}</p>
                    );
                })}
            </div>
        </div>
    );
}

export default UserTable;
