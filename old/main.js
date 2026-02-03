import { fetchTasksByProject } from './tasks.js';
import { filterTable, sortTable, clearTable } from './table.js';
const projectsData = {};

window.onload = () => {
  var selectProjectSettingBody = document.getElementById('projectSelect');
  var selectProjectBody = document.getElementById('projectsList');
  const tasksHeaderProject = document.getElementById('tasksHeaderProject');
  fetchProjects();

  //ProjectList
  selectProjectBody.addEventListener('change', () => {
    const selectProjectId = selectProjectBody.value;
    if (selectProjectId) {
      tasksHeaderProject.innerHTML =
        '' + selectProjectBody.options[selectProjectBody.selectedIndex].text;
      clearTable();
      fetchTasksByProject(selectProjectId);
    } else {
      clearTable();
      const header = document.getElementById('tasksHeaderTime');
      header.innerHTML = '';
      tasksHeaderProject.innerHTML = '';
      header.style.background = 'white';
    }
  });

  //Project Settings
  selectProjectSettingBody.addEventListener('change', () => {
    const selectedProjectId = selectProjectSettingBody.value;
    if (selectedProjectId) {
      getAllocatedTime(selectedProjectId);
    } else {
      const element = document.getElementById('totalTime');
      element.value = '';
      element.style.background = 'white';
    }
  });
};

//Получение всех групп и их вывод в select
function fetchProjects() {
  BX24.init(function () {
    BX24.installFinish();
    console.log('BX24 initialized successfully.');
    var groups = [];
    BX24.callMethod('sonet_group.get', {}, function (res) {
      groups = res.data();
      var selectBody = document.getElementById('projectSelect');
      var projectsListBody = document.getElementById('projectsList');
      groups.forEach((group) => {
        var newOption = new Option(group.NAME, group.ID);
        var newOptionCopy = new Option(group.NAME, group.ID);
        selectBody.add(newOption);
        projectsListBody.add(newOptionCopy);
      });
    });
  });
}

document.querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index));
});

const responsiblesBody = document.getElementById('responsiblesList');
responsiblesBody.addEventListener('change', () => {
  filterTable(responsiblesBody.options[responsiblesBody.selectedIndex].text);
});

const settingsButton = document.getElementById('showSettings');
settingsButton.addEventListener('click', () => {
  const modal = document.getElementById('settingsTab');
  modal.style.display = 'block';
});

const showManualButton = document.getElementById('showManual');
showManualButton.addEventListener('click', () => {
  const modal = document.getElementById('ModalManual');
  modal.style.display = 'block';
});

const showSupportButton = document.getElementById('showSupport');
showSupportButton.addEventListener('click', () => {
  window.open('https://bg59.ru/#b4494', '_blank');
});

window.onclick = function (event) {
  const modalSettings = document.getElementById('settingsTab');
  const modalManual = document.getElementById('ModalManual');
  if (event.target == modalSettings) {
    modalSettings.style.display = 'none';
  } else if (event.target == modalManual) {
    modalManual.style.display = 'none';
  }
};

// Закрытие модального окна
const closeSpan = document.getElementById('closeModal');
closeSpan.addEventListener('click', () => {
  const modal = document.getElementById('settingsTab');
  modal.style.display = 'none';
});

function getAllocatedTime(projectId) {
  const projectsData = {};
  var allocatedProjectTime = 0;
  BX24.callMethod(
    'app.option.get',
    {
      name: 'total_allocated_times',
    },
    function (result) {
      if (result.error()) {
        console.error('Ошибка при загрузке данных:', result.error());
      } else {
        const totalTimesString = result.answer.result.total_allocated_times;
        const totalTimes = totalTimesString ? JSON.parse(totalTimesString) : {}; // Преобразуем строку в объект
        Object.assign(projectsData, totalTimes);
        const totalTime = projectsData[projectId];
        if (totalTime == undefined) {
          document.getElementById('totalTime').value = parseFloat('0').toFixed(2); // Устанавливаем значение в input
        } else {
          allocatedProjectTime = parseFloat(totalTime).toFixed(2);
          document.getElementById('totalTime').value = allocatedProjectTime; // Устанавливаем значение в input
        }
      }
    },

    BX24.callMethod(
      'tasks.task.list',
      {
        filter: {
          GROUP_ID: projectId,
        },
      },
      (res) => {
        const tasks = res.answer.result.tasks;
        let totalTimeSpent = 0;
        tasks.forEach((task) => {
          totalTimeSpent += (task.timeSpentInLogs || 0) / 3600;
        });
        if (totalTimeSpent > allocatedProjectTime) {
          document.getElementById('totalTime').style.background = 'red';
        } else {
          document.getElementById('totalTime').style.background = 'white';
        }
      },
    ),
  );
}

document.getElementById('saveTimeButton').addEventListener('click', () => {
  const select = document.getElementById('projectSelect');
  const totalTime = document.getElementById('totalTime').value;
  const projectId = select.value;
  projectsData[projectId] = totalTime;
  BX24.callMethod(
    'app.option.set',
    {
      name: 'total_allocated_times',
      total_allocated_times: JSON.stringify(projectsData),
    },
    function (result) {
      if (result.error()) {
        console.log(result.error());
      } else {
        console.log(result.data());
        getAllocatedTime(projectId);
        var selectProjectBody = document.getElementById('projectsList');
        if (selectProjectBody.value == projectId) {
          clearTable();
          fetchTasksByProject(projectId);
        }
      }
    },
  );
});
