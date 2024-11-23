module.exports = {
  apps : [{
    name : "videoQueue1",
    script: 'detachedVideoQueuetest.js',
    args : "1"
  },
  {
    name : "videoQueue2",
    script: 'detachedVideoQueuetest.js',
    args : "2"
  },
  {
    name : "videoQueue3",
    script: 'detachedVideoQueuetest.js',
    args : "3"
  },
  {
    name : "videoInterface",
    script: 'videointerface.js',
  },
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
