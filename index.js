'use strict';

const form = document.querySelector('.form');
const addButton = document.querySelector('.add');
const delButton = document.querySelector('.del');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetButton = document.querySelector('.reset_button');

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(position, distance, duration) {
    this.position = position;
    this.distance = distance;// km
    this.duration = duration;// min        
  }
  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(position, distance, duration, cadence) {
    super(position, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    return this.pace = (this.duration / this.distance).toFixed(1); // min/km
  }
};

class Cycling extends Workout {
  type = "cycling";
  constructor(position, distance, duration, elevationGain) {
    super(position, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    return this.speed = this.distance / (this.duration / 60);
  }
};

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markers = [];
  constructor() {
    // get user position
    this._getPosition();
    // get data from local storage
    this._getLocalStorage();
    // attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    addButton.addEventListener('click', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); 
    delButton.addEventListener('click', this._hideForm.bind(this));
    containerWorkouts.addEventListener('click', this._toDeleteWorkout.bind(this));
    resetButton.addEventListener('click', this.modalReset.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), 
        function() {
      alert('Could not get your position');
    });
    }
  }
  _loadMap(position) {    
    const { latitude, longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.#map); 
    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('You are here now')
      .openPopup();  
    this.#map.on('click', this._showForm.bind(this));  
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    }) 
  }
  _showForm(eventMap) {
    this.#mapEvent = eventMap;
    form.classList.remove('hidden');
    inputType.focus();
    const {lat, lng} = this.#mapEvent.latlng;   
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: true,
        closeOnClick: true,
        className: document.querySelector('.form__input--type').value
      }))   
      .setPopupContent('<p>Hi there!</p>') 
      .openPopup(); 
  }
  _hideForm() {    
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";
    form.style.display = "none";
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(event) {
    const validationInputs = (...inputs) => inputs.every(input => Number.isFinite(input));    
    const isPositive = (...inputs) => inputs.every(input => input > 0);
    event.preventDefault();
    // Getting the data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const {lat, lng} = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (!validationInputs(distance, duration, cadence) || !isPositive(distance, duration, cadence)) {
        return this.modalMissData();
      }
      workout = new Running([lat, lng], distance, duration, cadence);
      this._initWorkout(workout);    
    }

    // If workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (!validationInputs(distance, duration, elevation) || !isPositive(distance, duration)) {
        return this.modalMissData();     
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this._initWorkout(workout);      
    }    
    this._setLocalStorage(this.#workouts);  
  }
  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.position)
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: true,
        closeOnClick: true,
        className: `${workout.type}-popup`
      }))      
      .setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`) 
      .openPopup(); 
    this.#markers.push(marker);
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description} <span class="close__workout">&#9587;</span></h2>       
        <div class="workout__details">
          <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (workout.type === "running") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      `;
    }
    if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      `;
    }
    form.insertAdjacentHTML('afterend', html);    
  }  
  _toDeleteWorkout(event) {    
    if (event.target.classList.contains("close__workout")) {
      const workoutEl = event.target.closest(".workout");
      const realWorkoutCoords = this.#workouts.find(item => item.id === workoutEl.dataset.id).position;
      const [lat, lng] = realWorkoutCoords;
      const marker = this.#markers.find(mark => mark.getLatLng().lat === lat && mark.getLatLng().lng === lng);   
      if (marker) {
        marker.remove();
        this.#markers.splice(this.#markers.indexOf(marker), 1);
      }  
      const newArrWorkouts = this.#workouts.filter(item => item.id !== workoutEl.dataset.id);  
      workoutEl.remove();    
      this.#workouts = newArrWorkouts; 
      this.#workouts.forEach(work => this._renderWorkoutMarker(work));
      this._setLocalStorage(this.#workouts);
    } else return;    
  }
  _initWorkout(workout) {
    this.#workouts.push(workout);   
    this._renderWorkoutMarker(workout); 
    this._renderWorkout(workout);
    this._hideForm();
  }
  _moveToPopup(event) {
    const workoutEl = event.target.closest('.workout');
    if (event.target.classList.contains("close__workout")) return;
    if (workoutEl) {
      const workout = this.#workouts.find(item => item.id === workoutEl.dataset.id);  
      this.#map.setView(workout.position, this.#mapZoomLevel, {
        animate: true,
        pan: {
          duration: 1
        }
      });
    }   
  }
  _setLocalStorage(set) {
    localStorage.setItem('workouts', JSON.stringify(set));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    // const dataArr = [];
    // for (let item in data) {
    //   const {lat, lng} = item.position;      
    //   const restoredWorkout = item.type === "running" ? new Running([lat, lng], item.distance, item.duration, item.cadence) : new Cycling([lat, lng], item.distance, item.duration, item.elevationGain);
    //   dataArr.push(restoredWorkout);
    // }    
    this.#workouts = data;
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    })
    console.log(this.#workouts);
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
  modalView(question, answerYes, answerNo) {
    return `
      <div class="modal-layer">
        <div class="modal-window">
          <div class="modal-text-container">
            <p class="modal-text">${question}</p>
          </div>          
          <div class="modal-buttons">
            <button class="button-yes">${answerYes}</button>
            <button class="button-no">${answerNo}</button>
          </div>          
        </div>
      </div>
    `;    
  }
  modalReset() {
    const modal = this.modalView('Are you sure?', 'Sure, yes', 'Oo, no!');
    document.body.insertAdjacentHTML('afterbegin', modal); 
    document.querySelector('.button-yes').addEventListener('click', () => {
      this.reset();
    });
    document.querySelector('.button-no').addEventListener('click', () => {
      document.body.removeChild(document.querySelector('.modal-layer'));
    });
  }  
  modalMissData() {
    const modal = this.modalView('Input has to be positive number. Will you input some?', 'Yes', 'Cancel all');
    document.body.insertAdjacentHTML('afterbegin', modal); 
    document.querySelector('.button-yes').addEventListener('click', () => {
      document.body.removeChild(document.querySelector('.modal-layer'));
    });
    document.querySelector('.button-no').addEventListener('click', () => {
      document.body.removeChild(document.querySelector('.modal-layer'));
      inputDistance.value = inputDuration.value = inputCadence.value = "";
    });
  }
}

const app = new App();