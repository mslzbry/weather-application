const form = document.querySelector('.search form')
const input = document.querySelector('.search input')
const msg = document.querySelector('.search .msg')
const weatherList = document.querySelector('.weather-display .forecast')
const apiKey = '1da1a85c293ab27aa32f96dc209429cb'
const history = $('#history')

function searchCity (searchTerm) {
  console.log('searching for ', searchTerm)
}

function displaySearchHistory () {
  var searchHistory = JSON.parse(localStorage.getItem('cities'))

  for (var i = 0; i < searchHistory.length; i++) {
    history.append(
      '<li><button class="history-item">' + searchHistory[i] + '</button></li>'
    )
  }
  var historyItems = document.querySelectorAll('.history-item')

  // add event listener to each button
  for (var j = 0; j < historyItems.length; j++) {
    historyItems[j].addEventListener('click', e => {
      searchCity(e.target.innerText)
    })
  }
}

form.addEventListener('submit', e => {
  e.preventDefault()

  // remove the existing weather list items if they are present
  $('ul').empty()

  var userInput = input.value
  // handle condition if user input contains comma e.g. san diego, ca
  if (userInput.includes(',')) {
    userInput = userInput.split(',')[0]
  }

  //fetch here
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${userInput}&appid=${apiKey}&units=imperial`

  var lat = ''
  var lon = ''

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log(data)
      const { main, name, sys, weather, coord, wind, dt } = data
      const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${weather[0]['icon']}.svg`
      const li = document.createElement('li')
      li.classList.add('city')
      const markup = `
        <h2 class="city-name" data-name="${name},${sys.country}">
          <span>${name}</span>
          <sup>${sys.country}</sup>
        </h2>
        <div class="city-temp">${Math.round(main.temp)}<sup>°F</sup></div>
        <figure>
          <img class="city-icon" src="${icon}" alt="${
        weather[0]['description']
      }">
          <figcaption>${weather[0]['description']}</figcaption>
        <div class="city-wind">Wind: ${wind.speed}<sup>MPH</sup></div>
        <div class="city-wind">Humidity: ${main.humidity}<sup>%</sup></div>
        </figure>
      `
      li.innerHTML = markup
      weatherList.appendChild(li)

      // save the city in local storage for display in history of most recently searched cities
      var cities = []
      // if there is nothing in local storage, create a new entry cities, with the value of the first city
      var storedCities = JSON.parse(localStorage.getItem('cities'))
      if (storedCities == null) {
        cities.push(name)
        localStorage.setItem('cities', JSON.stringify(cities))
      } else {
        console.log(storedCities)
        cities = storedCities
        cities.push(name)
        localStorage.setItem('cities', JSON.stringify(cities))
      }

      // display previously searched cities in local storage as buttons
      displaySearchHistory()
      // second fetch gets 5 day forecast from lat/long api call
      lat = coord['lat']
      lon = coord['lon']

      var fiveDayUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`
      return fetch(fiveDayUrl)
    })
    .then(response => response.json())
    .then(data => {
      // 5 days' worth of forecast info, coming in 3 hr intervals
      // pick the forecast/weather at 12pm every day and use that as the forecast
      buildFiveDayForecast(data)
    })
    .catch(() => {
      msg.textContent = 'Please enter a valid city.'
    })

  msg.textContent = ''
  form.reset()
  input.focus()
})

function buildFiveDayForecast (data) {
  var fiveDaysData = []
  console.log('building forcast')
  for (var i = 0; i < data['list'].length; i++) {
    if (data['list'][i]['dt_txt'].includes('12:00:00')) {
      var forecast = {
        date: data['list'][i]['dt_txt'],
        unixdate: data['list'][i]['dt'],
        temp: (data['list'][i]['main']['temp'] - 273.15) * 1.8 + 32, // api returns temp in Kelvin, need to convert to F
        wind: data['list'][i]['wind']['speed'],
        weather: data['list'][i]['weather'][0]['description'],
        icon: data['list'][i]['weather'][0]['icon'],
        humidity: data['list'][i]['main']['humidity']
      }
      fiveDaysData.push(forecast)
    }
  }
  console.log('showing forecast now')
  console.log(fiveDaysData)

  // now that the data has been parsed out from the api, build the html

  for (i = 0; i < fiveDaysData.length; i++) {
    const li = document.createElement('li')
    li.classList.add('city')
    const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${fiveDaysData[i]['icon']}.svg`

    const markup = `
      <h2>${new Date(fiveDaysData[i]['date']).toLocaleDateString('en-US')}</h2>
      <div class="city-temp">${Math.round(
        fiveDaysData[i]['temp']
      )}<sup>°F</sup></div>
      <figure>
        <img class="city-icon" src="${icon}" alt="${
      fiveDaysData[i]['weather']
    }">
        <figcaption>${fiveDaysData[i]['weather']}</figcaption>
      <div class="city-wind">Wind: ${
        fiveDaysData[i]['wind']
      }<sup>MPH</sup></div>
      <div class="city-wind">Humidity: ${
        fiveDaysData[i]['humidity']
      }<sup>%</sup></div>
      </figure>
    `
    li.innerHTML = markup
    weatherList.appendChild(li)
  }
}

displaySearchHistory()
