- Mike should update his .env to be the same as his old computer and re-test the LLM functionality
- Join screen
    - The banner stating "for best experience rotate to landscape" is no longer there
    - landscape view on mobile requires scroll
- Lobby screen
    - "ADD BOT" button should be on the players page
    - "ADD BOT" button should only be visible if the first player has the secret name ("SANANBYEKIM")
    - If there are no spectators, the "Spectators:" heading should not be displayed
    - Only on mobile, in my testing, when creating a new game as host, the "Start game" button was greyed out until you swap to the settings tab and back
    - on mobile, landscape view requires scroll and the room code is aligned right for no obvious reason
- End screen for Poetry
    - slightly more space below "Done! If you'd like to play again, make a new room."
    - slightly more space below the color key for poetry contributions
- Now that we're using buttons for canvas controls
    Make clicking the button show the descriptor tooltip
    because ipad/iphone has no mouseover
- In highly-portrait viewport situations, the line width slider overflows out of view to the left
- On iPad, the default line width of using your finger after using pencil is extremely small, but a single dot is very large
- End screen aspect ratio not getting set up correctly for small macbook / iPad screen in landscape
- "How to play" modal for the drawing version of the game?
- Fix bug where user changes system theme it disconnects them and they have to refresh browser
- General code quality
- One player two drawings, it should alternate between drawings
- Two players two drawings, one drawing is complete, player gets no visual feedback    that they're waiting on the other player
- Spectator view currently defaults to carousel, but if enough real estate is available
    We could consider laying them out as two columns
- Lobby vertically centered, probably too far down the page
