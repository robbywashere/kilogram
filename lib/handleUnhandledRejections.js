process.on('unhandledRejection',(e)=>{
  console.error('~~ Unhandled Reject, Exiting! ~~');
  console.error(e.stack);
  process.exit(1);
});
