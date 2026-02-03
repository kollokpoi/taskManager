export function clearTable() {
  const tbody = document.querySelector('#tasksTable tbody');
  tbody.innerHTML = '';
  document.getElementById('tasksHeaderTime').innerHTML = '';

  const pieChartCanvas = document.getElementById('timeChart');
  if (pieChartCanvas) {
    const pieChartInstance = Chart.getChart(pieChartCanvas);
    if (pieChartInstance) {
      pieChartInstance.destroy();
    }
  }

  // Уничтожаем гистограмму, если она существует
  const barChartCanvas = document.getElementById('barChart');
  if (barChartCanvas) {
    const barChartInstance = Chart.getChart(barChartCanvas);
    if (barChartInstance) {
      barChartInstance.destroy();
    }
    // Удаляем холст гистограммы из DOM
    barChartCanvas.remove();
  }
}

export function destroyCharts() {}

export function filterTable(value) {
  const tbody = document.querySelector('#tasksTable tbody');
  const rows = tbody.getElementsByTagName('tr');
  console.log(value);
  for (let i = 0; i < rows.length - 1; i++) {
    const responsibleCell = rows[i].cells[2];
    if (responsibleCell) {
      const cellText = responsibleCell.innerText;
      const isVisible = value === 'Выберите сотрудника' || cellText.includes(value);
      rows[i].style.display = isVisible ? '' : 'none'; // Показываем или скрываем строку
    }
  }
}

export function sortTable(columnIndex) {
  const table = document.getElementById('tasksTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.rows).slice(0, -1); // Получаем все строки, кроме итоговой

  const isAscending = table.getAttribute('data-sort-order') === 'asc';

  // Сортируем строки
  rows.sort((a, b) => {
    const aValue = parseFloat(a.cells[columnIndex].innerText);
    const bValue = parseFloat(b.cells[columnIndex].innerText);
    return isAscending ? aValue - bValue : bValue - aValue; // Сортировка по возрастанию или убыванию
  });
  const totalRow = tbody.querySelector('.totalRow');
  totalRow.style.display = 'none';

  // Сначала добавляем отсортированные строки
  rows.forEach((row) => {
    if (row.style.display !== 'none') {
      tbody.appendChild(row);
    }
  });
  //Отображение итоговой строки
  tbody.appendChild(totalRow);
  totalRow.style.display = '';

  // Меняем порядок сортировки
  table.setAttribute('data-sort-order', isAscending ? 'desc' : 'asc');
}
