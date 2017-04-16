import React, { Component } from 'react';
// import PageHead from '../PageHead';
import { Config } from '../../Config';
import io from 'socket.io-client';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import Sound from 'react-sound';
import { withGoogleMap, GoogleMap, Marker, InfoWindow } from "react-google-maps";
import SearchBox from "react-google-maps/lib/places/SearchBox";
import fireMarker from './fire.png';
import normalMarker from './normal-marker.png';
import offlineMarker from './offline-marker.png';
import fireHydrantMarkerImg from './fire-hydrant.png';
import { ToastContainer, ToastMessage } from "react-toastr";
import _ from 'lodash';
import './indexMap.css';
import DeviceLogModal from './DeviceLogModal';
import MarkerDetailInfoModal from './MarkerDetailInfoModal';
import Autosuggest from 'react-autosuggest';
import MapStores from './MapStores';
import { Table } from 'react-bootstrap';
import renderHTML from 'react-render-html';
import MarkerDetailInfoModalTabNearByFireHydrant from './MarkerDetailInfoModalTabNearByFireHydrant';
import { observer } from 'mobx-react';
import Sidebar from 'react-sidebar';
import NotificationSideBar from './NotificationSideBar';
import { browserHistory } from 'react-router';

//Set lai theme cho auto suggest bang cach dat ten class + indexMap de tranh viec bi trung className
const themeAutoSuggest = {
    container: 'react-autosuggest__container_indexMap',
    containerOpen: 'react-autosuggest__container--open_indexMap',
    input: 'react-autosuggest__input_indexMap',
    inputOpen: 'react-autosuggest__input--open_indexMap',
    inputFocused: 'react-autosuggest__input--focused_indexMap',
    suggestionsContainer: 'react-autosuggest__suggestions-container_indexMap',
    suggestionsContainerOpen: 'react-autosuggest__suggestions-container--open_indexMap',
    suggestionsList: 'react-autosuggest__suggestions-list_indexMap',
    suggestion: 'react-autosuggest__suggestion_indexMap',
    suggestionFirst: 'react-autosuggest__suggestion--first_indexMap',
    suggestionHighlighted: 'react-autosuggest__suggestion--highlighted_indexMap',
    sectionContainer: 'react-autosuggest__section-container_indexMap',
    sectionContainerFirst: 'react-autosuggest__section-container--first_indexMap',
    sectionTitle: 'react-autosuggest__section-title_indexMap'
};
var mapStores;

/* global google */
const TOAST_ERROR = 1;
const TOAST_INFO = 2;
const TOAST_SUCCESS = 3;
const TOAST_WARNING = 4;

const ToastMessageFactory = React.createFactory(ToastMessage.animation);
let socket = io(Config.SocketUrl);

var listDevicesAutoCorrects = [];

// Teach Autosuggest how to calculate suggestions for any given input value.
const getSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? listDevicesAutoCorrects : listDevicesAutoCorrects.filter(item =>
        !_.isNull(item.name) && item.name.toLowerCase().slice(0, inputLength) === inputValue //Tim theo ten
        ||
        !_.isNull(item.phone) && item.phone.toLowerCase().slice(0, inputLength) === inputValue //Tim theo sdt
        ||
        !_.isNull(item.markerId) && item.markerId.toLowerCase().slice(0, inputLength) === inputValue //Tim theo markerId
        ||
        !_.isNull(item.address) && item.address.toLowerCase().slice(0, inputLength) === inputValue //Tim theo dia chi
    );
};

// When suggestion is clicked, Autosuggest needs to populate the input element
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion.markerId + " - " + suggestion.name;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => (
    <div>
        {suggestion.markerId} - {suggestion.name}
        <div className="suggestionSub">
            {suggestion.phone} - {suggestion.address}
        </div>
    </div>
);

//SearchBox style
const INPUT_STYLE = {
    boxSizing: 'border-box',
    MozBoxSizing: 'border-box',
    border: '1px solid transparent',
    width: '240px',
    height: '32px',
    marginTop: '6px',
    padding: '0 12px',
    borderRadius: '1px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    fontSize: '14px',
    outline: 'none',
    textOverflow: 'ellipses',
};

const listGroupItemStyle = {
    border: '0px'
}

//Render marker
const GettingStartedGoogleMap = withGoogleMap(props => (

    <GoogleMap
        ref={props.onMapMounted}
        defaultZoom={14}
        center={props.center}
        onBoundsChanged={props.onBoundsChanged}
    >
        {/*<SearchBox
            ref={props.onSearchBoxMounted}
            bounds={props.bounds}
            controlPosition={google.maps.ControlPosition.TOP_LEFT}
            onPlacesChanged={props.onPlacesChanged}
            inputPlaceholder="Tìm kiếm địa điểm"
            inputStyle={INPUT_STYLE}
        />*/}
        {/*{props.markerPlace.map((marker, index) => (
            <Marker
                key={index}
                position={marker.position}
            >
            </Marker>
        ))}*/}

        {
            props.fireHydrantsMarkers.map((fireHydrantsMarker, index) => (
                <Marker
                    icon={{
                        url: fireHydrantMarkerImg
                    }}
                    key={index}
                    options={{ optimized: false }}
                    animation={4}
                    position={new google.maps.LatLng(fireHydrantsMarker.lat, fireHydrantsMarker.long)}
                    onMouseOut={() => props.onFireHydrantMarkerMouseOut(fireHydrantsMarker)}
                    onMouseOver={() => props.onFireHydrantMarkerMouseOver(fireHydrantsMarker)}
                > {fireHydrantsMarker.showInfo && (
                    <InfoWindow>
                        <ul className="list-group">
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-info"></i>{fireHydrantsMarker.name}
                            </li>
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-location-arrow"></i> {fireHydrantsMarker.address}
                            </li>
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-file-text"></i>{fireHydrantsMarker.desc}
                            </li>
                        </ul>
                    </InfoWindow>
                )}
                </Marker>
            ))
        }

        {props.markers.map((marker, index) => (
            <Marker
                icon={{
                    url: marker.icon
                }}
                key={index}
                options={{ optimized: false }}
                animation={marker.animation}
                position={marker.position}
                onMouseOut={() => props.onMarkerMouseOut(marker)}
                onMouseOver={() => props.onMarkerMouseOver(marker)}
                onClick={() => props.onMarkerClick(marker)}
            >
                {marker.showInfo && (
                    <InfoWindow onCloseClick={() => props.onMarkerClose(marker)}>
                        <ul className="list-group">
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-info"></i>{marker.name}
                            </li>
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-location-arrow"></i> {marker.address}
                            </li>
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-phone-square"></i>{marker.phone}
                            </li>
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-bolt" aria-hidden="true"></i>
                                {marker.powerCordState}
                            </li>
                            <li className="list-group-item" style={listGroupItemStyle}>
                                <i className="fa fa-headphones" aria-hidden="true"></i>
                                {marker.headSetState}
                            </li>
                            <li>
                                {/*<button onClick={props.onBtnViewLogClick} data-markerId={marker.markerId} className="btn btn-success btn-view-log">Xem log</button>
                                <button onClick={props.onBtnInfoClick} data-markerId={marker.markerId} className="btn btn-info btn-view-log">Chi tiết</button>*/}
                            </li>
                        </ul>
                    </InfoWindow>
                )}
            </Marker>
        ))}
    </GoogleMap >
));
//Main map
class IndexMap extends Component {

    constructor(props) {
        super(props);
        mapStores = new MapStores();
        this.state = {
            bounds: null,
            showModal: false,
            showLogModal: false,
            showMarkerDetailLogModal: false,
            modalContent: '',
            listDevices: [],
            markers: [],
            markerPlace: [],
            fireHydrantsMarkers: [],
            deviceLog: [],
            fireHistoryId: '',
            center: { lat: 21.028952, lng: 105.852394 },
            value: '', //for suggestion
            suggestions: [],
            markerDetailInfoModalData: {},
            sidebarIcon: 'fa fa-bell',
            sidebarIconColor: '#1abc9c',
            sidebarHomeIconColor: '#3498db'
        };
        this.close = this.close.bind(this);
        this.closeLogModal = this.closeLogModal.bind(this);
        this.closeMarkerDetailLogModal = this.closeMarkerDetailLogModal.bind(this);
        this.handleMarkerClick = this.handleMarkerClick.bind(this);
        this.handleMarkerClose = this.handleMarkerClose.bind(this);
        this.handlePlacesChanged = this.handlePlacesChanged.bind(this);
        this.handleSearchBoxMounted = this.handleSearchBoxMounted.bind(this);
        this.handleMapMounted = this.handleMapMounted.bind(this);
        this.handleBoundsChanged = this.handleBoundsChanged.bind(this);
        this.handleChanged = this.handleChanged.bind(this);
        this.showToast = this.showToast.bind(this);
        this.logConnected = this.logConnected.bind(this);
        this.logDisconnected = this.logDisconnected.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.handleMarkerOnMouseOut = this.handleMarkerOnMouseOut.bind(this);
        this.handleMarkerOnMouseOver = this.handleMarkerOnMouseOver.bind(this);
        this.handleFireHydrantMarkerOnMouseOut = this.handleFireHydrantMarkerOnMouseOut.bind(this);
        this.handleFireHydrantMarkerOnMouseOver = this.handleFireHydrantMarkerOnMouseOver.bind(this);
        this.getFireHydrants = this.getFireHydrants.bind(this);
        this.onNotificationClicked = this.onNotificationClicked.bind(this);
        this.onHomeClicked = this.onHomeClicked.bind(this);
		 this.onLoginClicked = this.onLoginClicked.bind(this);
    }

    //Sidebar config

    getInitialState() {
        return { sidebarOpen: false, sidebarDocked: false };
    }

    onHomeClicked() {
        browserHistory.push('/ListDevices');

    }
	 onLoginClicked() {
        browserHistory.push('/Login');

    }

    onNotificationClicked() {
        if (this.state.sidebarOpen) {
            this.onSetSidebarOpen(false);
            this.setState({ sidebarIcon: 'fa fa-bell', sidebarIconColor: '#1abc9c' });
        } else {
            this.onSetSidebarOpen(true);
            this.setState({ sidebarIcon: 'fa fa-times', sidebarIconColor: '#e74c3c' });
        }
    }

    onSetSidebarOpen(open) {
        this.setState({ sidebarOpen: open, docked: open });
    }
    //End side bar

    //Suggestion
    onSuggestionSelected(event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) {
        this.setState({ deviceLog: [], center: { lat: suggestion.lat, lng: suggestion.long } });
        //Bat popup marker id da chon giong handleMarkerClick
        var self = this;
        var token = localStorage.getItem('token');
        var json = {};
        json.markerId = suggestion.markerId;
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            auth: {
                username: Config.basicAuthUsername,
                password: Config.basicAuthPassword
            },
            headers: { 'x-access-token': token }
        });
        instance.post('/DeviceRoute/GetMarkerById', json).then(function (response) {
            //Lay ve history 
            var json2 = {}
            json2.markerId = suggestion.markerId;
            var instance2 = axios.create({
                baseURL: Config.ServiceUrl,
                timeout: Config.RequestTimeOut,
                auth: {
                    username: Config.basicAuthUsername,
                    password: Config.basicAuthPassword
                },
                headers: { 'x-access-token': token }
            });

            instance2.post('/DeviceRoute/GetDeviceLogs', json2).then(function (response2) {
                if (self.mapStores) {
                    self.mapStores.fireHydrantLat = response.data.data.lat;
                    self.mapStores.fireHydrantLong = response.data.data.long;
                }


                self.setState({ markerDetailInfoModalData: response.data.data, markerDetailInfoModalDataHistory: response2.data.data, showMarkerDetailLogModal: true });
            });
        });
    }

    //Suggestion on change
    onChange = (event, { newValue }) => {
        var self = this;
        this.setState({
            value: newValue
        }, () => {

        });
    };

    // Autosuggest will call this function every time you need to update suggestions.
    // You already implemented this logic above, so just use it.
    onSuggestionsFetchRequested = ({ value }) => {
        this.setState({
            suggestions: getSuggestions(value)
        });
    };

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    };

    logDisconnected(markerId) {
        //save log
        var self = this;
        var token = localStorage.getItem('token');
        var json = {}
        json.markerId = markerId;
        json.logType = "Trạng thái";
        json.logDesc = "Đã bị ngắt kết nối (Disconnected)";
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            auth: {
                username: Config.basicAuthUsername,
                password: Config.basicAuthPassword
            },
            headers: { 'x-access-token': token }
        });
        instance.post('/DeviceRoute/InsertDeviceLogFromWeb', json).then(function (response) {
            self.setState({ datas: response.data.data });
        });
        //end save log
    }

    logConnected(markerId) {
        //save log
        var self = this;
        var token = localStorage.getItem('token');
        var json = {}
        json.markerId = markerId;
        json.logType = "Trạng thái";
        json.logDesc = "Đã kết nối (Connected)";
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            auth: {
                username: Config.basicAuthUsername,
                password: Config.basicAuthPassword
            },
            headers: { 'x-access-token': token }
        });
        instance.post('/DeviceRoute/InsertDeviceLogFromWeb', json).then(function (response) {
            self.setState({ datas: response.data.data });
        });
        //end save log
    }

    componentDidMount() {

        var self = this;

        socket.on('DeviceFireStateChanged', function (data) {

            var arrListDevices = self.state.listDevices;

            _.forEach(arrListDevices, function (value) {
                if (_.isEqual(value.MarkerId, arrListDevices.MarkerId)) {
                    if (data.isFire) {
                        console.log(data.doc.thumbImg);
                        self.setState({
                            
                            showModal: true,
                            txtTxtFireNote: '',
                            modalContent: 'Cảnh báo cháy',
                            modalContentName: data.doc.name,
                            modalContentAddress: data.doc.address,
                            modalContentPhone: data.doc.phone,
                            modalContentDesc: data.doc.desc,
                            modalContentImei: data.doc.imei,
                            modalContentId: data.markerId,
                            modalContentThumbImg: data.doc.thumbImg,
                            modalContentThongTinCoSo: data.thongTinCoSo,
                            modalContentLat: data.doc.lat,
                            modalContentLong: data.doc.long,
                            fireHistoryId: data.fireHistoryId
                        });
                        self.showToast(TOAST_ERROR, 'Cảnh báo cháy', data.doc.name);
                    } else {
                        self.showToast(TOAST_INFO, 'Cảnh báo cháy', 'Tại: ' + data.doc.name + ' Đã tắt');
                    }

                    self.setState({
                        markers: self.state.markers.map(marker => {
                            if (_.isEqual(marker.markerId, data.MarkerId)) {

                                return {
                                    ...marker,
                                    icon: data.isFire ? fireMarker : normalMarker,
                                    animation: data.isFire ? 1 : 4
                                };
                            }
                            return marker;
                        }),
                    });

                    return false;
                }
            });


        });

        socket.on('DeviceConnected', function (data) {
            self.setState({
                markers: self.state.markers.map(marker => {
                    if (_.isEqual(marker.markerId, data)) {
                        self.showToast(TOAST_INFO, marker.name, 'Đã kết nối!');
                        self.logConnected(marker.markerId);

                        return {
                            ...marker,
                            icon: normalMarker,
                            animation: 4
                        };
                    }
                    return marker;
                }),
            });


        });

        socket.on('DeviceDisconnected', function (data) {
            self.setState({
                markers: self.state.markers.map(marker => {
                    if (_.isEqual(marker.markerId, data)) {
                        self.showToast(TOAST_WARNING, marker.name, 'Đã bị ngắt kết nối!');
                        self.logDisconnected(marker.markerId);
                        return {
                            ...marker,
                            icon: offlineMarker,
                            animation: 4
                        };
                    }
                    return marker;
                }),
            });
        });

        //Lay danh sach marker tren ban do
        var token = localStorage.getItem('token');
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            auth: {
                username: Config.basicAuthUsername,
                password: Config.basicAuthPassword
            },
            headers: { 'x-access-token': token }
        });

        instance.get('/MainMap/ListDevices').then(function (response) {
            //vi tri dau tien ma user theo doi ma he thong tim duoc
            var firstLoadLat = _.toNumber(response.data.lat);
            var firstLoadLong = _.toNumber(response.data.long);
            if (!firstLoadLat || !firstLoadLong) {
                //Neu khong tim thay vi tri theo doi mac dinh chon marker dau tien
                firstLoadLat = response.data.data[0].lat;
                firstLoadLong = response.data.data[0].long;
            }


            self.setState({ listDevices: response.data.data, center: { lat: firstLoadLat, lng: firstLoadLong } });

            listDevicesAutoCorrects = response.data.data;

            var tempMarkers = [];
            _.forEach(response.data.data, function (device) {
                var markerIcon = offlineMarker;
                if (device.isOnline) {
                    if (device.isFire) {
                        markerIcon = fireMarker;
                    } else {
                        markerIcon = normalMarker;
                    }
                }
                tempMarkers.push({
                    markerId: device.markerId,
                    position: new google.maps.LatLng(device.lat, device.long),
                    name: device.name,
                    address: device.address,
                    phone: device.phone,
                    icon: markerIcon,
                    animation: device.isFire ? 1 : 4,
                    showInfo: false,
                    powerCordState: device.powerCordState ? "Đang cắm sạc" : "Chưa cắm sạc",
                    headSetState: device.headSetState ? "Đang cắm giắc tín hiệu" : "Chưa cắm giắc tín hiệu"
                });
            });

            self.setState({ markers: tempMarkers });
        });
        this.getFireHydrants();
    }

    getFireHydrants() {
        var self = this;
        var token = localStorage.getItem('token');
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            auth: {
                username: Config.basicAuthUsername,
                password: Config.basicAuthPassword
            },
            headers: { 'x-access-token': token }
        });
        instance.get('/FireHydrant/GetFireHyrant').then(function (response) {
            self.setState({ fireHydrantsMarkers: response.data.data });
        });
    }

    handleChanged(e) {
        var state = {};
        state[e.target.name] = e.target.value;
        this.setState(state);
    }

    handleMarkerClick(targetMarker) {
        this.setState({ deviceLog: [] });
        var self = this;
        var token = localStorage.getItem('token');
        var json = {}
        json.markerId = targetMarker.markerId;
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            auth: {
                username: Config.basicAuthUsername,
                password: Config.basicAuthPassword
            },
            headers: { 'x-access-token': token }
        });
        instance.post('/DeviceRoute/GetMarkerById', json).then(function (response) {
            //Lay ve history 
            var json2 = {}
            json2.markerId = targetMarker.markerId;
            var instance2 = axios.create({
                baseURL: Config.ServiceUrl,
                timeout: Config.RequestTimeOut,
                auth: {
                    username: Config.basicAuthUsername,
                    password: Config.basicAuthPassword
                },
                headers: { 'x-access-token': token }
            });

            instance2.post('/DeviceRoute/GetDeviceLogs', json2).then(function (response2) {
                if (self.mapStores) {
                    self.mapStores.fireHydrantLat = response2.data.data.lat;
                    self.mapStores.fireHydrantLong = response2.data.data.long;
                }

                self.setState({ markerDetailInfoModalData: response.data.data, markerDetailInfoModalDataHistory: response2.data.data, showMarkerDetailLogModal: true });
            });
        });
    }

    handleMarkerClose(targetMarker) {
        this.setState({
            markers: this.state.markers.map(marker => {
                if (marker === targetMarker) {
                    return {
                        ...marker,
                        showInfo: false,
                    };
                }
                return marker;
            }),
        });
    }

    handleMarkerOnMouseOut(targetMarker) {
        this.setState({
            markers: this.state.markers.map(marker => {
                if (marker === targetMarker) {
                    return {
                        ...marker,
                        showInfo: false,
                    };
                }
                return marker;
            }),
        });
    }

    handleMarkerOnMouseOver(targetMarker) {
        this.setState({
            markers: this.state.markers.map(marker => {
                if (marker === targetMarker) {
                    return {
                        ...marker,
                        showInfo: true,
                    };
                }
                return marker;
            }),
        });
    }

    handleFireHydrantMarkerOnMouseOut(targetMarker) {
        this.setState({
            fireHydrantsMarkers: this.state.fireHydrantsMarkers.map(marker => {
                if (marker === targetMarker) {
                    return {
                        ...marker,
                        showInfo: false,
                    };
                }
                return marker;
            }),
        });
    }

    handleFireHydrantMarkerOnMouseOver(targetMarker) {
        this.setState({
            fireHydrantsMarkers: this.state.fireHydrantsMarkers.map(marker => {
                if (marker === targetMarker) {
                    return {
                        ...marker,
                        showInfo: true,
                    };
                }
                return marker;
            }),
        });
    }

    handleMapMounted(map) {
        this._map = map;
    }
    handleBoundsChanged() {
        //When map moved
    }
    handleSearchBoxMounted(searchBox) {
        this._searchBox = searchBox;
    }

    handlePlacesChanged() {
        // const places = this._searchBox.getPlaces();

        // Add a marker for each place returned from search bar
        // const markerPlaces = places.map(place => ({
        //     position: place.geometry.location
        // }));

        // Set markers; set map center to first search result
        // var firstPlaceLat = places[0].geometry.location.lat();
        // var firstPlaceLong = places[0].geometry.location.lng();
        // this.setState({
        //     center: { lat: firstPlaceLat, lng: firstPlaceLong },
        //     // markerPlace: markerPlaces
        // });
    }

    //Close the alert dialog
    close() {
        var obj = Object();
        obj.table = 'firehistories';
        obj.value = this.state.fireHistoryId
        obj.cellName = 'note';
        obj.cellValue = this.state.txtTxtFireNote;

        var token = localStorage.getItem('token');
        var instance = axios.create({
            baseURL: Config.ServiceUrl,
            timeout: Config.RequestTimeOut,
            headers: { 'x-access-token': token }
        });
        instance.post('/Common/UpdateDataById', obj).then(function (response) {
        });
        this.setState({ showModal: false });
    }

    //close the log modal
    closeLogModal() {
        this.setState({ showLogModal: false });
    }

    //Close the marker detail modal
    closeMarkerDetailLogModal() {
        this.setState({ showMarkerDetailLogModal: false });
    }

    showToast(type, title, content) {
        const TIME_OUT = 1500;

        switch (type) {
            case TOAST_ERROR:
                this.refs.container.error(
                    content,
                    title, {
                        timeOut: TIME_OUT
                    });
                break;
            case TOAST_INFO:
                this.refs.container.info(
                    content,
                    title, {
                        timeOut: TIME_OUT
                    });
                break;
            case TOAST_SUCCESS:
                this.refs.container.success(
                    content,
                    title, {
                        timeOut: TIME_OUT
                    });
                break;
            case TOAST_WARNING:
                this.refs.container.warning(
                    content,
                    title, {
                        timeOut: TIME_OUT
                    });
                break;
            default:
                this.refs.container.info(
                    content,
                    title, {
                        timeOut: TIME_OUT
                    });
                break;
        }

    }

    render() {

        const sidebarContent = <NotificationSideBar />;

        const sidebarProps = {
            sidebar: sidebarContent,
            sidebarClassName: 'sidebar-notification',
            open: this.state.sidebarOpen,
            touch: true,
            docked: this.state.docked,
            shadow: true,
            touchHandleWidth: 20,
            dragToggleDistance: 30,
            transitions: true,
            onSetOpen: this.onSetSidebarOpen,
        };
        const { value, suggestions } = this.state;

        // Autosuggest will pass through all these props to the input element.
        const inputProps = {
            placeholder: 'Tìm kiếm địa điểm tủ báo cháy',
            value,
            onChange: this.onChange
        };

        return (
            //BEGIN PAGE CONTAINER 
            <Sidebar {...sidebarProps}>
                <div className="page-map">
                    <Modal show={this.state.showModal} onHide={this.close}>
                        <Modal.Header closeButton>
                            <Modal.Title>Cảnh báo cháy</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Sound url="assets/ding.wav" playStatus="PLAYING" />
                            <div>
                                <div className="tabbable-line">
                                    <ul className="nav nav-tabs ">
                                        <li className="active">
                                            <a href="#tab1" data-toggle="tab">
                                                Thông tin chi tiết </a>
                                        </li>
                                        {/*<li>
                                            <a href="#tab2" data-toggle="tab">
                                                Nguồn nước </a>
                                        </li>*/}
                                        <li>
                                            <a href="#tab3" data-toggle="tab">
                                                Thông tin cơ sở </a>
                                        </li>
                                    </ul>
                                    <div className="tab-content">
                                        <div className="tab-pane active" id="tab1">

                                            {
                                              
                                                this.state.modalContentThumbImg && this.state.modalContentThumbImg.length > 0
                                                    ?
                                                    <div>
                                                        <img src={Config.ServiceUrl + "/uploads/DeviceThumb/" + this.state.modalContentThumbImg} width="300px" height="auto" style={{ display: 'block', margin: '0 auto' }} />
                                                        <br />
                                                        <br />
                                                    </div>
                                                    :
                                                    ''
                                            }
                                            <ul className="list-group">
                                                <li className="list-group-item">
                                                    <div className="row">
                                                        <div className="col-md-2">
                                                            ID:
                                                    </div>
                                                        <div className="col-md-10">
                                                            <b>{this.state.modalContentId}</b>
                                                        </div>
                                                    </div>

                                                </li>
                                                <li className="list-group-item">
                                                    <div className="row">
                                                        <div className="col-md-2">
                                                            Tên:
                                                    </div>
                                                        <div className="col-md-10">
                                                            <b>{this.state.modalContentName}</b>
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className="list-group-item">
                                                    <div className="row">
                                                        <div className="col-md-2">
                                                            Địa chỉ:
                                                    </div>
                                                        <div className="col-md-10">
                                                            <b>{this.state.modalContentAddress}</b>
                                                        </div>
                                                    </div>

                                                </li>
                                                <li className="list-group-item">
                                                    <div className="row">
                                                        <div className="col-md-2">
                                                            Điện thoại:
                                                    </div>
                                                        <div className="col-md-10">
                                                            <b>{this.state.modalContentPhone}</b>
                                                        </div>
                                                    </div>
                                                </li>

                                                <li className="list-group-item">
                                                    <div className="row">
                                                        <div className="col-md-2">
                                                            Mô tả:
                                                    </div>
                                                        <div className="col-md-10">
                                                            <b>{this.state.modalContentDesc}</b>
                                                        </div>
                                                    </div>
                                                </li>
                                            </ul>
                                            <br /> <br />
                                            <label htmlFor="txtTxtFireNote">Nhập ghi chú vụ cháy </label>
                                            <input placeholder="Nhập ghi chú" onChange={this.handleChanged} type="text" className="form-control" id="idTxtFireNote" name="txtTxtFireNote" />
                                            <br />
                                            <MarkerDetailInfoModalTabNearByFireHydrant mapStores={mapStores} lat={this.state.modalContentLat} long={this.state.modalContentLong} distance={Config.distanceFireHydrant} />
                                        </div>
                                        {/*<div className="tab-pane" id="tab2">
                                            <MarkerDetailInfoModalTabNearByFireHydrant mapStores={mapStores} lat={this.state.modalContentLat} long={this.state.modalContentLong} distance={Config.distanceFireHydrant} />
                                        </div>*/}
                                        <div className="tab-pane" id="tab3">
                                            {this.state.modalContentThongTinCoSo ? renderHTML(this.state.modalContentThongTinCoSo) : ''}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button bsStyle="danger" onClick={this.close}>Close</Button>
                        </Modal.Footer>
                    </Modal>

                    <ToastContainer
                        toastMessageFactory={ToastMessageFactory}
                        ref="container"
                        className="toast-top-right">
                        <Sound url="assets/you-have-new-message.mp3" playStatus="PLAYING" />
                    </ToastContainer>

                    <MarkerDetailInfoModal mapStores={mapStores} show={this.state.showMarkerDetailLogModal} data={this.state.markerDetailInfoModalData} dataHistory={this.state.markerDetailInfoModalDataHistory} onHide={this.closeMarkerDetailLogModal} />

                    <Autosuggest
                        theme={themeAutoSuggest}
                        suggestions={suggestions}
                        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                        onSuggestionSelected={this.onSuggestionSelected}
                        getSuggestionValue={getSuggestionValue}
                        renderSuggestion={renderSuggestion}
                        inputProps={inputProps}
                        alwaysRenderSuggestions={true}
                    />

                    <GettingStartedGoogleMap
                        center={this.state.center}
                        containerElement={
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                            }} />
                        }
                        mapElement={
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }} />
                        }
                        markers={
                            this.state.markers
                        }
                        markerPlace={
                            this.state.markerPlace
                        }
                        fireHydrantsMarkers={
                            this.state.fireHydrantsMarkers
                        }
                        onMapMounted={this.handleMapMounted}
                        onBoundsChanged={this.handleBoundsChanged}
                        bounds={this.state.bounds}
                        onSearchBoxMounted={this.handleSearchBoxMounted}
                        onPlacesChanged={this.handlePlacesChanged}
                        onMarkerClick={this.handleMarkerClick}
                        onMarkerClose={this.handleMarkerClose}
                        onMarkerMouseOut={this.handleMarkerOnMouseOut}
                        onMarkerMouseOver={this.handleMarkerOnMouseOver}
                        onFireHydrantMarkerMouseOut={this.handleFireHydrantMarkerOnMouseOut}
                        onFireHydrantMarkerMouseOver={this.handleFireHydrantMarkerOnMouseOver}
                    />

                </div>
                <div id="notification-circle" style={{ background: this.state.sidebarIconColor }} onClick={this.onNotificationClicked}>
                    {/*<span id="number">31</span>*/}
                    <i className={this.state.sidebarIcon} aria-hidden="true"></i>
                </div>

                <div id="notification-circle-home" style={{ background: this.state.sidebarHomeIconColor }} onClick={this.onHomeClicked}>
                    {/*<span id="number">31</span>*/}
                    <i className="icon-home" aria-hidden="true"></i>
                </div>
				 <div id="notification-circle-login" style={{ background: this.state.sidebarHomeIconColor }} onClick={this.onLoginClicked}>
                    {/*<span id="number">31</span>*/}
                    <i className="icon-user" aria-hidden="true"></i>
                </div>
            </Sidebar>
        );
    }

}

export default observer(IndexMap);