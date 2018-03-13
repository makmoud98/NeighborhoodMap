var map = null;
var infoWindow = null;
var center = {lat: 41.8310086, lng: -87.6288022};

var MapViewModel = function() {
	var self = this;
	self.showPanel = ko.observable(false);
	self.showFilter = ko.observable(true);
	self.query = ko.observable("");
	self.locations = ko.observableArray();
	self.markers = [];
	self.openWindow = function (item){
		for(var i = 0; i < self.markers.length; i++){
			var marker = self.markers[i];
			if(marker.title == item.title){
				setInfoWindow(map, marker, infoWindow);
				animateMarker(marker);
			}
		}
	};
	// inspired by https://stackoverflow.com/questions/29551997/knockout-search-filter
	self.processFilter = ko.computed(function () {
		var query = self.query().toLowerCase();
	    var result = ko.utils.arrayFilter(self.locations(), function (location) {
	        var title = location.title.toLowerCase();
	        return title.indexOf(query) >= 0;
	    });
	    // hide markers that were not in the filter results
	    for(var i = 0; i < self.markers.length; i++){
		    var marker = self.markers[i];
		    var visible = false;
		    for(var j = 0; j < result.length; j++){
		    	var location = result[j];
		    	if(marker.title == location.title){
		    		visible = true;
		    		break;
		    	}
		    }
		    marker.setVisible(visible);
		    // if infowindow is open and this is the marker its open on and this marker has been hidden
		    if(infoWindow.marker && infoWindow.marker.title == marker.title && !visible){
		    	// then close the window
		    	infoWindow.close();
		    }
		}
		// creates a location object to show when no results were found
	    if(result.length === 0){
	    	return {title: "No results found", position: center};
	    }
	    return result;
	});
};

// this is a hack to avoid the jshint error: "Weird construction. Is 'new' necessary?"
// when it was clearly necessary..
var viewModel = new MapViewModel();

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: center
    });
    infoWindow = new google.maps.InfoWindow();
    $.ajax("https://api.foursquare.com/v2/venues/explore", {
    	data: {
    		client_id: '3TFGQXNXYNCJRGVH0G2ZMJ3PC2QDVMCCYSUSEEBPQSUP4WTL',
			client_secret: 'FSRAYMNIBH2ZPDHL4IMTL5Q1F1FT2YCS0NXRAQQV4P0E43M2',
			v: '20170801',
    		ll: center.lat + "," + center.lng,
    		section: "topPicks",
    		limit: 5
    	}
    })
    .done(function(data) {
    	for(var i = 0; i < data.response.groups[0].items.length; i++) {
			var item = data.response.groups[0].items[i];
			var info = '<div id="info-window">';
			// not all data will be available for all venues, check are made to avoid null pointers
			if (item.venue.url) info += '<h5><a href="'+ item.venue.url + '">' + item.venue.name + '</a></h5>';
			else if (item.venue.name) info += "<h5>" + item.venue.name + "</h5>";
			if (item.venue.location) {
				if(item.venue.location.address)
					info += "<p>" + item.venue.location.address + "</p>";
			}
			if (item.venue.hours) {
				if(item.venue.hours.status)
					info += "<p>" + item.venue.hours.status + "</p>";
			}


			var location = {title: item.venue.name,
							position: {lat: item.venue.location.lat,
									   lng: item.venue.location.lng} };
			// stores loactions in the viewModel to be displayed on the list view
			viewModel.locations.push(location);
			// info is added to the marker to be used when setting info window
			var marker = new google.maps.Marker({
				position: {lat: location.position.lat, lng: location.position.lng},
				map: map,
				title: location.title,
				info: info,
				animation: google.maps.Animation.DROP
			});
			viewModel.markers.push(marker);
			marker.addListener("click", onMarkerClick);
		}
		// the panel is hidden until the ajax request is complete
		viewModel.showPanel(true);
    })
    .fail(function(error) {
    	showErrorMessage("There was an issue communicating with the Foursquare API");
    });
}

function googleMapsError() {
	showErrorMessage("There was an issue communicating with the Google Maps API");
}

function onMarkerClick() {
	setInfoWindow(map, this, infoWindow);
	animateMarker(this);
}

// this function adapted from udacity nanodegree program lesson 7 part 7
function setInfoWindow(map, marker, infoWindow){
	if(infoWindow.marker != marker){
		infoWindow.marker = marker;
		infoWindow.setContent(marker.info);
		infoWindow.open(map, marker);
		infoWindow.addListener("closeclick", function(){
			infoWindow.marker = null;
		});
	}
}

// this function partly adapted from google api docs
function animateMarker(marker) {
	if (marker.getAnimation() !== null) marker.setAnimation(null);
	else marker.setAnimation(google.maps.Animation.BOUNCE);
	// stops the marker animation after 1 second
	setTimeout(function() {
		marker.setAnimation(null);
	}, 1000);
}

// this shows an error where the list view would be rendered
function showErrorMessage(error) {
	// this will create a location that servers as an error message
	viewModel.locations.push({title: error, position: viewModel.center});
	// show panel..
	viewModel.showPanel(true);
	// but hide filter box
	viewModel.showFilter(false);
}

ko.applyBindings(viewModel);