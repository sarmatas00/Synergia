// This script installs dependencies for two different directories
//using npm and then audits them for vulnerabilities.
//The 'exec' function is used to execute commands in the terminal. The 'path' module is used to set
//the current working directory for the second directory. 


const { exec } = require('child_process');
const path = require('path');

// Define the command to install dependencies for the Synergia base app
const install1 = exec('npm install', {
    stdio: 'inherit',
  });

  install1.on('close', () => {
      
      // Once dependencies are installed for the first directory, define the command to install dependencies for synChat
  const install2 = exec('npm install', {
    cwd: path.join(__dirname,'/synChat'),
    stdio: 'inherit',
  });

  install2.on('close', () => {

    // Fix any vulnerabilities in the directories
    const audit1 = exec('npm audit fix', {
        stdio: 'inherit',
      });
      const audit2 = exec('npm audit fix', {
        cwd: path.join(__dirname,'/synChat'),
        stdio: 'inherit',
      });
  
      //This method is used to wait for both 'npm audit fix' commands to complete before logging a message to the console.
      Promise.all([audit1, audit2]).then(() => {
          // Once 'npm audit fix' is complete for both directories, log a message to the console
        console.log('Dependencies installed and audited for both directories.');
      });
    
  });
});

