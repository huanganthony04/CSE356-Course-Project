module.exports = {
    apps : [{
      name : "server",
      script: 'server.js',
    },
    {
      name : "videoQueue",
      script: 'VideoService/VideoWorkerAndQueue/videoQueue.js',
    }
    ],
  
    deploy : {
      production : {
        user : 'SSH_USERNAME',
        host : 'SSH_HOSTMACHINE',
        ref  : 'origin/master',
        repo : 'GIT_REPOSITORY',
        path : 'DESTINATION_PATH',
        'pre-deploy-local': '',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
        'pre-setup': ''
      }
    }
  };