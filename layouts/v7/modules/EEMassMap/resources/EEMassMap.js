/*+**********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is: EntExt
 * The Initial Developer of the Original Code is EntExt.
 * All Rights Reserved.
 * If you have any questions or comments, please email: devel@entext.com
 ************************************************************************************/

Vtiger.Class("EEMassMap_Js",{},{

    registerLeaflet : function() {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = 'layouts/v7/modules/EEMassMap/resources/leaflet/leaflet.css';
        document.head.appendChild(link);

        var script = document.createElement('script');
        script.src = "layouts/v7/modules/EEMassMap/resources/leaflet/leaflet.js";
        document.head.appendChild(script);
    },

    registerMassMapAction : function() {
        if(!$(".listViewMassActions #showMap").length) {
            $(".listViewMassActions ul").append('<li id="showMap"><a href="javascript:void(0);">Map</a></li>');
        }
    },

    registerMapModal : function() {
        $("body").append(
            '<div class="modal fade bs-example-modal-lg" id="MapModal" style="display: none; max-height: 95vh !important;">' +
                '<div class="modal-dialog modal-lg">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header"> ' +
                            '<button type="button" class="close" data-dismiss="modal">&times;</button> ' +
                            '<h4 class="modal-title">Map</h4> ' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<div id="map" style="height:75vh;"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        )
    },

    registerShowMapAction : function() {
        var MapModal = jQuery('#MapModal');

        var map = null;

        jQuery('#showMap').on('click',function(e) {
            var listInstance = Vtiger_List_Js.getInstance();
            var validationResult = listInstance.checkListRecordSelected();
            if(validationResult != true) {
                var aDeferred = jQuery.Deferred();
                var params = {};
                var moduleName = app.getModuleName();
                MapModal.modal('show');

                app.helper.showProgress();

                params['module'] = 'EEMassMap';
                params['source_module'] = moduleName;
                params['action'] = 'GetSelectedRecordsCoordinates';
                params['selectedIds'] = listInstance.readSelectedIds(true);
                app.request.get({'data':params}).then(
                    function(error, data) {
                        if(error == null) {

                            app.helper.hideProgress();

                            map = L.map('map', {scrollWheelZoom:true}).setView([0, 0], 15);
                            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            }).addTo(map);

                            var markersArray = [];
                            var markerDetails = data;
                            for(var i = 0; i < markerDetails.length; i++) {

                                if (markerDetails[i]['lat'] == null || markerDetails[i]['lng'] == null) {
                                    continue;
                                }

                                var marker = L.marker([markerDetails[i]['lat'], markerDetails[i]['lng']]).addTo(map);

                                marker.on('mouseover', (function (marker, i) {
                                    return function () {
                                        marker.bindPopup('<div>' + markerDetails[i]['entityName'] + '</div>');
                                        marker.openPopup();
                                    }
                                })(marker, i));

                                marker.on('mouseout', (function (marker, i) {
                                    return function () {
                                        marker.closePopup();                                    }
                                })(marker, i));

                                marker.on('click', (function (marker, i) {
                                    return function () {
                                        window.location.href = 'index.php?module=' + moduleName + '&view=Detail&record=' + markerDetails[i]['recordId'];
                                    }
                                })(marker, i));

                                markersArray.push(marker);
                            }

                            if(markersArray.length > 0) {
                                var group = new L.featureGroup(markersArray);
                                map.fitBounds(group.getBounds().pad(0.5));
                            }
                        }
                        app.helper.hideProgress();
                        aDeferred.resolve(data);
                    },

                    function(error) {
                        app.helper.hideProgress();
                        aDeferred.reject(error);
                    }
                );


            } else {
                listInstance.noRecordSelectedAlert();
                MapModal.modal('hide');
            }
        });

        MapModal.on('hidden.bs.modal', function () {
            if(map) {
                map.remove();
            }
        });
    },

    validViewAndModule : function() {
        var viewName = app.getViewName();
        var currentModule = app.getModuleName();
        return !!(viewName == 'List' && ['Leads', 'Accounts', 'Contacts'].indexOf(currentModule) != -1);

    },

    registerEvents : function() {
        this.registerLeaflet();
        this.registerMassMapAction();
        this.registerMapModal();
        this.registerShowMapAction();
    }

});

jQuery(document).ready(function() {
    var eeAddressAutocompleteInstance = new EEMassMap_Js();
    if(!eeAddressAutocompleteInstance.validViewAndModule()) return;
    eeAddressAutocompleteInstance.registerEvents();
    app.listenPostAjaxReady(function() {
        var eeAddressAutocompleteInstance = new EEMassMap_Js();
        eeAddressAutocompleteInstance.registerEvents();
    });

});


