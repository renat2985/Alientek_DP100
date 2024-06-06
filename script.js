$(document).ready(function() {
  var $delay = 1000,
  vMin = .1,
  vMax = 30,
  cMin = .0,
  cMax = 5,
  mMin = 0,
  mMax = 100,
  totalPoints = 200,
  $voltageDisplay = $('div.volts'),
  $currentDisplay = $('div.amps'),
  $moistureDisplay = $('div.moisture');

  function getRandomInt(min, max) {
    let reading = (Math.random() * (max - min + 1) + min);
    return (Math.round(reading * 2) / 2)
  }

  function updateVoltage(value) {
    $voltageDisplay.html(value.toFixed(1));
  }

  function updateCurrent(value) {
    $currentDisplay.html(value.toFixed(1));
  }

  function updateMoisture(value) {
    $moistureDisplay.html(value.toFixed(1) + '<span>%</span>');
  }

  function updateSensorDisplayValues(d) {
    updateVoltage(d[0]);
    updateCurrent(d[1]);
    updateMoisture(d[2]);
  }

  Highcharts.setOptions({
    global: {
      useUTC: false
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false
        }
      }
    },
    tooltip: {
      enabled: true
    }
  });

  $('#sensorData').highcharts({
    chart: {
      type: 'spline',
      events: {
        load: function() {
          var voltage = this.series[0];
          var current = this.series[1];
          var moisture = this.series[2];
          var x, volts, amps, mPercent;

          // faking sensor data
          // data will be coming from sensors on the MKR1000
          setInterval(function() {
            x = (new Date()).getTime(),
            volts = getRandomInt(vMin, vMax),
            amps = getRandomInt(cMin, cMax),
            mPercent = getRandomInt(mMin, mMax);

            voltage.addPoint([x, volts], false, true);
            current.addPoint([x, amps], false, true);
            moisture.addPoint([x, mPercent], true, true);

            updateSensorDisplayValues([volts, amps, mPercent]);
          }, $delay);
        }
      }
    },
    title: {
      text: 'Chart'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 50
    },
    yAxis: [{
      title: {
        text: 'VOLTAGE',
        style: {
          color: '#2b908f',
          font: '13px sans-serif'
        }
      },
      min: 0,
      max: 30,
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    }, {
      title: {
        text: 'CURRENT',
        style: {
          color: '#90ee7e',
          font: '13px sans-serif'
        }
      },
      min: 0,
      max: 5,
      opposite: true,
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    }, {
      title: {
        text: 'LOAD',
        style: {
          color: '#f45b5b',
          font: '13px sans-serif'
        }
      },
      min: 0,
      max: 100,
      opposite: true,
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    }],
    tooltip: {
      formatter: function() {
        var unitOfMeasurement = this.series.name === 'VOLTAGE' ? ' V': ' A';
        return '<b>' + this.series.name + '</b><br/>' +
        Highcharts.numberFormat(this.y, 1) + unitOfMeasurement;
      }
    },
    legend: {
      enabled: true
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'VOLTAGE',
      yAxis: 0,
      style: {
        color: '#2b908f'
      },
      data: (function() {
        // generate an array of random data
        var data = [],
        time = (new Date()).getTime(),
        i;

        for (i = -totalPoints; i <= 0; i += 1) {
          data.push({
            x: time + i * $delay,
            y: getRandomInt(12, 12)
          });
        }
        return data;
      }())
    }, {
      name: 'CURRENT',
      yAxis: 1,
      data: (function() {
        // generate an array of random data
        var data = [],
        time = (new Date()).getTime(),
        i;

        for (i = -totalPoints; i <= 0; i += 1) {
          data.push({
            x: time + i * $delay,
            y: getRandomInt(.7, .7)
          });
        }
        return data;
      }())
    }, {
      name: 'LOAD',
      yAxis: 2,
      data: (function() {
        // generate an array of random data
        var data = [],
        time = (new Date()).getTime(),
        i;

        for (i = -totalPoints; i <= 0; i += 1) {
          data.push({
            x: time + i * $delay,
            y: getRandomInt(1, 1)
          });
        }
        return data;
      }())
    }]
  });
});


function toggleConnect() {
  const connect = document.getElementById('connect');
  const dashboard = document.getElementById('main-column');
  connect.classList.add('hidden');
  dashboard.classList.remove('dimmed');
}


async function connect() {
  if (!('hid' in navigator)) {
    alert('WebHID API is not supported in your browser.');
    return;
  }
  const filters = [{
    vendorId: 0x0483,
    productId: 0x5750
  }];

  try {
    const device = await navigator.hid.requestDevice({
      filters
    });
    await device.open();

    console.log("Device connected");

    device.addEventListener('inputreport', event => {
      const {
        data
      } = event;
      const dataArray = new Uint8Array(data.buffer);
      const voltage = dataArray[1] + (dataArray[2] / 100);
      const current = dataArray[3] + (dataArray[4] / 1000);
      // updateVoltage(value);
      //  updateCurrent(value);
      //  updateMoisture(value);
      // document.getElementById('voltage').textContent = voltage.toFixed(2);
      // document.getElementById('current').textContent = current.toFixed(3);
      console.log("Voltage:", voltage, "V");
      console.log("Current:", current, "A");
    });

    // Example command to request voltage and current
    const reportId = 0x01;
    const data = new Uint8Array([0x01, 0x03, 0x04, 0x00]);
    await device.sendReport(reportId, data);

    console.log("Command sent");

  } catch (error) {
    console.error("There was an error:", error);
  }
}

document.getElementById("connectButton").addEventListener("click", connect);