import * as React from "react";
import { SocketInfoContext } from "../../context/SocketInfoProvider";
import { ILine, IUserTableInfo } from "../../types";
import { initSockets } from "../../context/SocketActions";

type Props = {
    children: JSX.Element
}

export default function SocketHandler({ children }: Props) {
    // instead of creating the socket state here,
    // only create the socket and pass it into the correct React router outlet
    // (basically a way to pass a socket for useContext type usage)
    // if a socket is necessary
    // no socket needed for Join page, Library, poem permalink (Page)
    const [ userInfo, setUserInfo ] = React.useState<IUserTableInfo>({} as IUserTableInfo);
    const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    const [ joinErrorMessage, setJoinErrorMessage ] = React.useState<string>("");

    React.useEffect(() => initSockets({ setUserInfo, setPoemsLines, setJoinErrorMessage }), [ initSockets ]);

    return (
        <SocketInfoContext.Provider value={{ userInfo, poemsLines, joinErrorMessage }}>
            {children}
        </SocketInfoContext.Provider>
    );
}
