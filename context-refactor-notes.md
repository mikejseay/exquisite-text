Situations where message passing is necessary

ClientToServer

1. The user is providing information that updates the game state.
	- They set their name
	- The set a game setting
	- They typed in the LineInput
	- They submitted a piece of the poem
	- They completed the poem

ServerToClient

1. The user's client needs information that it does not already have
	- The user joins a lobby that is forming
	- The user is watching another player write a line


Explicit Requests
-----------------

ClientToServer
--------------
App (root element that provides an outlet to a screen)
	- recognizeDevice -- sends device ID (from localStorage) to backend to return someone to ongoing game
Join
	joinGameAs (seems fine)
Lobby
	RoomCode
		getRoomCode
	UserTable
		getUserTableInfo
	GameSettings
		alterGameSettings (seems fine)
		startGame (seems fine)
		getSettingsEnabled
		getGameSettingsInfo

Listeners
---------

Join Screen
	joinErrorListener
	navigateListener (move to screen-global listener)
Lobby
	RoomCode
		roomCodeListener
	UserTable
		userTableInfoListener
	GameSettings
		gameSettingsInfo
		gameSettingsEnabled

to do
-----
- requests / listens are organized by screen
	- Screen-Global Requests
	- Screen-Global Listeners
		navigateListener
	- Join is nicely self-contained
	- Lobby Requests
	- Lobby Listeners
	- Game / Spectate Requests
	- Game / Spectate Listeners
	- End Requests
- common requestor element (?)
	- mainly useful in situations where a player is re-joining the game after having the tab closed
	- should re-establish the game state as it exists when they re-connect, based on their role and screen
	- should synchronize state AND THEN navigate the player to the correct screen

- code patterns that say socket.emit("getGameInfo") can be converted into a pattern like this

	// First try to get the info from context
	// It might already be there, or a common element is doing requests
	const gameInfo = getGameInfo();

	// If the info is not already in context
	if (gameInfo === null) {

		// Put in a request to refresh the game context maybe?
		requestGameInfoMaybe();

		// Or just wait until the info gets set?
	    return null;
	}

- common listener element navigateListener lives in common listener element (useful to be able to navigate from any screen)
- getRoomCode & roomCodeListener are NOT necessary
	- room code should be set in global context as a result of successful game join
- getSettingsEnabled is NOT necessary
	- whether game settings are enabled should be able to be set in global contet as a result of successful game join (VIP = enabled, non-VIP = disabled)
- getGameSettingsInfo IS necessary
	this info should be requested after successful game join just before we navigate to the Lobby screen
- userTableInfoListener lives in common listener element
- getUserTableInfo might be unnecessary
- 
