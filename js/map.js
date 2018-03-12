var map = null;
var infoWindow = null;

var viewModel = new function MapViewModel() {
	var self = this;
	self.center = {lat: 41.8310086, lng: -87.6288022};
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
	//inspired by https://stackoverflow.com/questions/29551997/knockout-search-filter
	self.processFilter = ko.computed(function () {
		var query = self.query().toLowerCase();
	    var result = ko.utils.arrayFilter(self.locations(), function (location) {
	        var title = location.title.toLowerCase();
	        return title.indexOf(query) >= 0;
	    });
	    for(var i = 0; i < self.markers.length; i++){
		    var marker = self.markers[i];
		    marker.setVisible(false);
		    for(var j = 0; j < result.length; j++){
		    	var location = result[j];
		    	if(marker.title == location.title){
		    		marker.setVisible(true);
		    		break;
		    	}
		    }
		}
	    if(result.length == 0){
	    	return {title: "No results found", position: self.center};
	    }
	    return result;
	});
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: viewModel.center
    });
    infoWindow = new google.maps.InfoWindow();
    $.ajax("https://api.foursquare.com/v2/venues/explore", {
    	data: {
    		client_id: '3TFGQXNXYNCJRGVH0G2ZMJ3PC2QDVMCCYSUSEEBPQSUP4WTL',
			client_secret: 'FSRAYMNIBH2ZPDHL4IMTL5Q1F1FT2YCS0NXRAQQV4P0E43M2',
			v: '20170801',
    		ll: viewModel.center.lat + "," + viewModel.center.lng,
    		section: "topPicks",
    		limit: 5
    	},
    	success: function (data){
			for(var i in data.response.groups[0].items) {
				var item = data.response.groups[0].items[i];
				var info = "";

				if(item.venue.url) info += '<h5><a href="'+ item.venue.url + '">' + item.venue.name + '</a></h5>';
				else if(item.venue.name) info += "<h5>" + item.venue.name + "</h5>";
				if(item.venue.location){
					if(item.venue.location.address)
						info += "<p>" + item.venue.location.address + "</p>"
				}
				if(item.venue.hours){
					if(item.venue.hours.status)
						info += "<p>" + item.venue.hours.status + "</p>";
				}


				var location = {title: item.venue.name,
								position: {lat: item.venue.location.lat,
										   lng: item.venue.location.lng} }
				viewModel.locations.push(location);
				var marker = new google.maps.Marker({
					position: {lat: location.position.lat, lng: location.position.lng},
					map: map,
					title: location.title,
					info: info,
					animation: google.maps.Animation.DROP
				});
				viewModel.markers.push(marker);
				marker.addListener("click", function (){
					setInfoWindow(map, this, infoWindow);
					animateMarker(this);
				});
			}
		},
		error: function(err){
			viewModel.locations.push({title: "There was an issue communicating with the Foursquare API", position: self.center})
		}
    });
}

//this fucntion adapted from udacity nanodegree program lesson 7 part 7
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

//this fucntion partly adapted from google api docs
function animateMarker(marker) {
	if (marker.getAnimation() !== null) marker.setAnimation(null);
	else marker.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function() {
		marker.setAnimation(null);
	}, 1000);
}

function getContent(title) {
	$.ajax("https://api.yelp.com/v3/businesses/search", {
    	headers: {
    		"Access-Control-Allow-Origin": "*",
    		"Authorization": "Bearer 5rBErk61A2vT0WSRD7A26BCG7QiYBbmls7b0_JUDMAfmpfUwOgw-iKPPDProGut8dOjW4wjN90aqqV9pG1DTDeXgbBR2ckRv5iNzaFTI75KSnxxoeT4ngnxRwvylWnYx"
    	},
    	data: {
    		term: title,
			latitude: viewModel.center.lat,
			longitude: viewModel.center.lng,
    		limit: 1
    	},
    	success: function (data){
			return '<img src="' + businesses[0].image_url + '"></img>';
		},
		error: function (error) {
			return error;
		}
    });
}

ko.applyBindings(viewModel);