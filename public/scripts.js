/**
 * @param {object} map global variable holding the google map object
 * @param {Array} initialMarkers global array holding the event markers
 * @param {Array} cityfilterMarkers global array holding the filtered array markers
 * @param {object} geocoder global object initalizer  
 */
var map;
var initialMarkers = [];
var cityfilterMarkers = [];
var geocoder

/**
 * Initialize the map
 * 
 */
 initMap = async()=> {
     //hide the alert box when the map is initialized
    $(".alert").hide();
    $(".btn-light").hide();
    //initialize the map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 49.78321, lng: 9.94564},
    zoom: 5,
    gestureHandling: 'cooperative'
  });
 
  //initialize the geocoder
  geocoder = new google.maps.Geocoder();

  //get map coordinates
  const coordinates = getCoordinates();
  
  //pass the coordinates and the map to the function setMarker
   setMarker(coordinates, map,1800);

   //disble the input fields
   $("#city").removeAttr('disabled');
   $("#company").removeAttr('disabled');
}

/**
 * When the document is loaded call the initMap() function
 *  */ 
$('#document').ready(()=>{
    initMap();
})


/**
 * Makes an API call and gets all the location of the available events
 * @return {array} The total locations
 */
//get all the events from the database
getCoordinates = async() =>{
    const coordinates = await $.get('http://localhost:4000/coordinates');
   return coordinates.data;
}


//disabling the city input if the user wishes to filter by company
$("#company").on('keyup', ()=>{

    if($("#company").val().length > 0){
    $("#city").attr('disabled', 'disabled');
    } else if($("#company").val().length === 0) {
        $("#city").removeAttr('disabled');
    }
})

//disable the company filter if the user wishes to filber by city
$("#city").on('keyup', ()=>{
    if($("#city").val().length > 0){
    $("#company").attr('disabled', 'disabled');
    } else if($("#city").val().length === 0) {
        $("#company").removeAttr('disabled');
    }
})

/**
 * onClick function for the submit button
 */
//submit the form and filter the events
$("#submitBtn").click(async() => {

    //get text from input fields
   var companyInput = $("#company").val();
   var cityInput = $("#city").val();


   //pass the information to the getFilterOptionsAndCoordinates() func
  var data =  await getFilterOptionsAndCoordinates(companyInput, cityInput);


  //if the return is undefined show an alert box and hide it after 2s
    if(data === undefined){
        $(".alert").html("No excursion based on the city");
        $(".alert").show();
        setTimeout(()=>{
           $(".alert").hide();
        },2000)
    } else if(data.msg === 'dismiss'){
       //do nothing
    } 
    else {

      //remove the markers from the map
      removeMarkers();
      //remove filtered ones too if there are any 
      removeFilteredMarkers();
     //set filtered markers on the map
     setFilteredMarkers(data, map,1800);
     //show the refresh button 
     $(".btn-light").show();
    }
})

/**
 * Upon refresh button click, reset the input fields' values to be empty
 */
$(".btn-light").click(()=>{
    initMap();
    $("#company").val("");
    $("#city").val("");

})

/**
 * Get either a company or a city string by which to filter the events
 * @param {String} company specifies the company by which the user wants to filter 
 * @param {String} city specifies the city by which the user wants to filter
 * @return returns the filtered events to be used to visualize them on the map
 */
getFilterOptionsAndCoordinates =async(company, city) =>{
    //check to see which one of the input fields was not empty
     if(company == '' && city !==''){
       var data = getLocationByCity(city);
       //if there was no match, return -1
       if(data === null){
           return -1;
       }
       //else return the events
       return data;
     } else if(city == '' && company !==''){
         //call getLocationByCompany if the company field is not empty
       var something = getLocationByCompany(company);
       return {
         msg: "dismiss"
       }
     }
}

/**
 * Makes an API call which is going to return the events which match the city which the user inputted
 * @param {String} city city by which the user wants to filter
 * @return {array} returns an array with the filtered events
 */
getLocationByCity =async(city) =>{
    try{
  const coordinates = await $.get(`http://localhost:4000/coordinates/${city}`);
  const data = coordinates.data;
   if(data[0].length <=0){
       return -1;
   }
  return data;
    }catch(error){
       
    }
}

/**
 * Makes an API call which is going to return the events which match the company which the user inputted
 * @param {String} company company by which the user wants to filter
 * @return {array} returns an array filled with the filtered events
 */
getLocationByCompany = async(company) =>{
    if(city){
        const coordinates = await $.get(`http://localhost:4000/coordinates/company/${company}`);
        const data = coordinates.data;
        
        //if there are no found events based on the criteria, return -1 and show an alertbox
        if(data.length <=0){
        $(".alert").html("No excursion based on the company");
        $(".alert").show();
        setTimeout(()=>{
           $(".alert").hide();
        },2000);
        return -1;
        }

      //remove the markers from the map
      removeMarkers();
      //remove filtered ones too if there are any 
      removeFilteredMarkers();
         
      //loop through the array with the events and for each specific event get it's longitude and latitude and
      //forward it to the setFilteredCompanyMarkers() function which is going to display them on the map
        data.map(async(location)=>{
    
           var loc = await $.get(`http://localhost:4000/coordinates/company/location/latlng/${location.Id}`);
           setFilteredCompanyMarkers(loc.data, map, 1200);
        })
        //show the refresh button
        $(".btn-light").show();
     } else {
              return null;
    }
}

/**
 * Initial function which is used to display all events in the map
 * @param {array} coordinates array with all the locations of all events
 * @param {object} map google maps object which renders the map
 * @param {integer} timeout specifies after what time the markers should appear on the map
 */
setMarker = async(coordinates, map, timeout) =>{
    
    //since the information is a promise, resolve the promise with the async/await function
    cords = await coordinates;
    
    //map through the array with the locations and display the markers with animation 
    window.setTimeout(function(){
        cords.map(async(location)=>{
            
            var marker = new google.maps.Marker({
                position:{lat: location.Latitude, lng: location.Longitude},
                map:map,
                animation: google.maps.Animation.DROP
            });
             
                //get content string
          var contentString =  await getContentString(location);

        //   set up info window
             var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            //add an onClick listener to the map to show more information about a particular event
            marker.addListener('click', function() {
                infowindow.open(map, marker);
              });

              initialMarkers.push(marker);
        })
    }, timeout)
}

/**
 * Removes the inital markers from the map
 */
removeMarkers = async() =>{
   
    initialMarkers.map(location =>{
        location.setMap(null);
    })
}

/**
 * Removes the filtered markers from the map
 */
removeFilteredMarkers = () =>{
   
    cityfilterMarkers.map(location =>{
        location.setMap(null);
    })
}


/**
 * Displays the filtered markers by city  on the map
 * @param {array} coordinates contains the filtered events
 * @param {object} map google maps object for displaying the markers on the mpa
 * @param {integer} timeout specifies after what time the markers should appear on the map
 */

setFilteredMarkers = async(coordinates, map, timeout) =>{
    
    //since the information is a promise, resolve the promise with the async/await function
   var cords = await coordinates;
    var address = cords[0].City;
    var something;
    
    //if the city entered is not Ulm perform an API request to the google maps geocoder API and get the 
    //longitute and latitude of the specific city
    //else perform an API call to get the longitude and latitude of Ulm
    if(address !== 'Ulm'){
     something = await $.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}
   &key=AIzaSyDHtHOw6kHDqF_Exh2ktvyyQwmuYZ6ihi0&callback=initMap`);

    } else if(address === 'Ulm'){

     something = await $.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&components=country:DE&key=AIzaSyDHtHOw6kHDqF_Exh2ktvyyQwmuYZ6ihi0&callback=initMap`);

    }

    // get the city latitude and longitude
   var city = something.results[0].geometry.location;
   var cityLat = city.lat;
   var cityLng = city.lng;

    //map through the array with the locations and display the markers with animation 
    window.setTimeout(function(){
   
        cords.map(async(location)=>{
        

            var marker = new google.maps.Marker({
                position:{lat: location.Latitude, lng: location.Longitude},
                map:map,
                animation: google.maps.Animation.DROP
            });
             
                //get content string
          var contentString =  await getContentString(location);

        //   set up info window
             var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            marker.addListener('click', function() {
                infowindow.open(map, marker);
              });
            cityfilterMarkers.push(marker);
        })
        //initialize a longitude/latitude object which is going to be passed to the map
        var latlng = new google.maps.LatLng(cityLat, cityLng);
        map.panTo(latlng);
        map.zoom = 5;

    }, timeout)
}

/**
 * Displays the filtered markers by company on the map
 * @param {array} coordinates contains the filtered events
 * @param {object} map google maps object for displaying the markers on the map
 * @param {integer} timeout specifies after what time the markers should appear on the map
 */
setFilteredCompanyMarkers = async(coordinates, map, timeout) =>{

     var cords = await coordinates;
    //since the information is a promise, resolve the promise with the async/await function
    
    //map through the array with the locations and display the markers with animation 
    window.setTimeout(function(){
   
        cords.map(async(location)=>{
    
            var marker = new google.maps.Marker({
                position:{lat: location.Latitude, lng: location.Longitude},
                map:map,
                animation: google.maps.Animation.DROP
            });
             
                //get content string
          var contentString =  await getContentString(location);

        //   set up info window
             var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            marker.addListener('click', function() {
                infowindow.open(map, marker);
              });
            cityfilterMarkers.push(marker);
            map.setZoom(4);
        })
    }, timeout)
}


/**
 * Displays more information about the company upon marker click
 * @param {object} loc gets the location of the marker
 * @return {Object} returns a string object containing the information
 */
getContentString = async(loc) =>{

    const loC = await $.get(`http://localhost:4000/${loc.EventID}`);
    const location = loC.data;
     
    return contentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    `<h1 id="firstHeading" class="firstHeading"> Hosted by: ${location[0].Company}</h1>`+
    '<div id="bodyContent">'+
    `<p><b>${location[0].ShortDescription}</b></p>`+
    `<p>${location[0].LongDescription}</p>` +
    '</div>'+
    '</div>';
}


