
module.exports = function (robot) {

  robot.hear(new RegExp('[a-z]*'), function (res) {
    console.log(res.message);
    res.send('I heard you say ' + res.message.text);
  });

};
