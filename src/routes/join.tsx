import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function Join() {
  return (
    <div>
      <div style={{display: "flex", justifyContent: "center"}}>
        <Box
          component="form"
          sx={{
            '& > :not(style)': { m: 1, width: '25ch' },
            display: "flex",
            flexDirection: "column",
            marginBottom: "1em",
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            required
            label="Enter 4-Letter Code"
            variant="standard" />
          <TextField
            required
            label="Enter Your Name"
            variant="standard" />
        </Box>
      </div>
      <Stack
        spacing={2}
        direction="row"
        style={{justifyContent: "center"}}
      >
        <Button variant="contained">Write</Button>
        <Button variant="outlined">Spectate</Button>
      </Stack>
    </div>
  );
}
