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
    $voltageDisplay.html(value);
  }

  function updateCurrent(value) {
    $currentDisplay.html(value);
  }

  function updateMoisture(value) {
    $moistureDisplay.html(value.toFixed(2) + '<span>%</span>');
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


            if (document.getElementById('vin').textContent != '') {
              const thevolts = parseFloat(document.getElementById('vout').textContent);
              const theamps = parseFloat(document.getElementById('iout').textContent);
              x = (new Date()).getTime(),
              volts = thevolts,
              amps = theamps,
              mPercent = (amps / 5) * 100;
            } else {
              x = (new Date()).getTime(),
              volts = getRandomInt(vMin, vMax),
              amps = getRandomInt(cMin, cMax),
              mPercent = getRandomInt(mMin, mMax);
            }



            voltage.addPoint([x, volts], false, true);
            current.addPoint([x, amps], false, true);
            moisture.addPoint([x, mPercent], true, true);

            updateSensorDisplayValues([volts, amps, mPercent]);
          },
            $delay);
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
        Highcharts.numberFormat(this.y,
          1) + unitOfMeasurement;
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
    vendorId: 0x2E3C,
    productId: 0xAF01
  }];

  function crc16Modbus(buffer) {
    let crc = 0xFFFF;
    for (let pos = 0; pos < buffer.length; pos++) {
      crc ^= buffer[pos];
      for (let i = 8; i !== 0; i--) {
        if ((crc & 0x0001) !== 0) {
          crc >>= 1;
          crc ^= 0xA001;
        } else {
          crc >>= 1;
        }
      }
    }
    return crc;
  }

  function interpretUint16(dataArray, index) {
    return dataArray[index] | (dataArray[index + 1] << 8);
  }

  try {
    const devices = await navigator.hid.requestDevice({
      filters
    });
    if (devices.length === 0) {
      alert("No device selected.");
      return;
    }
    const device = devices[0];
    await device.open();
    console.log("Device connected:", device);
    toggleConnect();
    device.addEventListener('inputreport', event => {
      const {
        data
      } = event;
      const dataArray = new Uint8Array(data.buffer);
     // console.log("Data received:", dataArray);
      if (dataArray[0] === 0xFA) {
        // Убедимся, что это ответ от устройства
        const vin = interpretUint16(dataArray, 4) * 0.001;
        const vout = interpretUint16(dataArray, 6) * 0.001;
        const iout = interpretUint16(dataArray, 8) * 0.001;
        const vo_max = interpretUint16(dataArray, 10) * 0.001;
        const temp1 = interpretUint16(dataArray, 12);
        const temp2 = interpretUint16(dataArray, 14);
        const dc5v = interpretUint16(dataArray, 16) * 0.001;
        const out_mode = dataArray[18];
        const work_state = dataArray[19];
        document.getElementById('vin').textContent = vin.toFixed(2);
        document.getElementById('vout').textContent = vout.toFixed(2);
        document.getElementById('iout').textContent = iout.toFixed(3);
        document.getElementById('vo_max').textContent = vo_max.toFixed(2);
        document.getElementById('temp1').textContent = temp1;
        document.getElementById('temp2').textContent = temp2;
        document.getElementById('dc5v').textContent = dc5v.toFixed(2);
        document.getElementById('out_mode').textContent = out_mode;
        document.getElementById('work_state').textContent = work_state;
      }
    });

    async function requestData() {
      let data = new Uint8Array(64);
      data[0] = 0xFB; // Host to Device
      data[1] = 0x30; // OpCode for BASIC_INFO
      data[2] = 0x00; // Reserve
      data[3] = 0x00; // Len (no additional data)

      // Вычисляем CRC16
      const crc = crc16Modbus(data.subarray(0, 4));
      data[4] = crc & 0xFF; // CRC Low
      data[5] = (crc >> 8) & 0xFF; // CRC High

      await device.sendReport(0x00,
        data);
      //console.log("Data request sent");
    }

    setInterval(requestData,
      1000);

  } catch (error) {
    console.error("There was an error:",
      error);
  }
}

document.getElementById("connectButton").addEventListener("click", connect);