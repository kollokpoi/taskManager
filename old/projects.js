export function fetchProjects() {
  BX24.init(function () {
    BX24.installFinish();
    console.log('BX24 initialized successfully.');
    var groups = [];
    BX24.callMethod('sonet_group.get', {}, function (res) {
      groups = res.data();
      var selectBody = document.getElementById('projectSelect');
      groups.forEach((group) => {
        var newOption = new Option(group.NAME, group.ID);
        selectBody.add(newOption);
      });
    });
  });
}
