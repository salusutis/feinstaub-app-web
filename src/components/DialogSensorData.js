import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import LinearProgress from '@material-ui/core/LinearProgress';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Tooltip from '@material-ui/core/Tooltip';
import SwipeableViews from 'react-swipeable-views';
import { MuiPickersUtilsProvider, DatePicker } from 'material-ui-pickers';
import DateFnsUtils from '@date-io/date-fns';
import deLocale from 'date-fns/locale/de';
import { SensorIcon } from './index'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import Edit from '@material-ui/icons/Edit';
import { SensorDataTable } from './index';
import { Scrollbars } from 'react-custom-scrollbars';
import moment from 'moment';
import { ResponsiveLine } from '@nivo/line'
import Slider from '@material-ui/core/Slider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Switch from '@material-ui/core/Switch';
import request from 'superagent'
import strings from '../strings'

let counter = 0;

function TabContainer({ children, dir }) {
  return ( <Typography component="div" dir={dir} style={{ padding: 8 * 3 }}> {children} </Typography> );
}

function createData(time, pm1, pm2, temp, humidity, pressure) {
  counter += 1;
  return { id: counter, time, pm1, pm2, temp, humidity, pressure };
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  dir: PropTypes.string.isRequired,
};

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: 500,
  },
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  card: {
    minWidth: 275,
    margin: 15,
  },
  card_content: {
    height: 50,
    padding: 5
  },
  date_selection: {
    marginTop: 10,
  },
});

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

function round(x, n) {
    return Math.round(x * Math.pow(10, n)) / Math.pow(10, n)
}

class FullScreenDialog extends React.Component {
  state = {
    data: undefined,
    data_pm10 : [],
    data_pm2_5 : [],
    data_temp : [],
    data_humidity : [],
    data_pressure : [],
    data_graph: [],
    loading: true,
    picker: null,
    open: false,
    value: 0,
    default_date:  new Date(),
    selected_date: new Date(),
    dialog_details_open: false,
    current_zoom: 10000,
    enabled_pm10: true,
    enabled_pm2_5: true,
    enabled_temp: false,
    enabled_humidity: false,
    enabled_pressure: false,
  };

  constructor(props) {
    super(props)

    this.loadSensorData();
  }

  loadSensorData = () => {
    this.setState({ loading: true });

    let currentComponent = this;
    counter = 0;

    var from = this.state.selected_date;
    from.setHours(0,0,0,0);
    var to = new Date(from.getTime() + 86400000);

    request.post('https://h2801469.stratoserver.net/get.php')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ id: this.props.sensor.chip_id, from: from.getTime() / 1000, to: to.getTime() / 1000, minimize: true, with_gps: false, with_note: false })
      .end(function(err, res) {
        var result = res.text.trim();
        var obj = JSON.parse(result);

        var data_records = [];
        var data_records_graph = [];
        var list_pm1 = [];
        var list_pm2 = [];
        var list_temp = [];
        var list_humidity = [];
        var list_pressure = [];

        obj.map((item, key) => {
          var time = new Date(item.time * 1000);
          data_records.push(createData(moment(item.time * 1000).format("HH:mm:ss"), item.p1, item.p2, round(item.t, 1), round(item.h, 1), round(item.p / 100, 2)));
          var pm1_double = parseFloat(item.p1);
          var pm2_double = parseFloat(item.p2);
          var temp_double = parseFloat(round(item.t, 1));
          var humidity_double = parseFloat(round(item.h, 1));
          var pressure_double = parseFloat(round(item.p / 100, 2));
          list_pm1.push({ x: time, y: pm1_double });
          list_pm2.push({ x: time, y: pm2_double });
          list_temp.push({ x: time, y: temp_double });
          list_humidity.push({ x: time, y: humidity_double });
          list_pressure.push({ x: time, y: pressure_double });
          return (item, key);
        });

        if(currentComponent.state.enabled_pm10) data_records_graph.push({ id: strings.pm1, color: "hsl(353, 70%, 50%)", data: list_pm1 });
        if(currentComponent.state.enabled_pm2_5) data_records_graph.push({ id: strings.pm2, color: "hsl(87, 70%, 50%)", data: list_pm2 });
        if(currentComponent.state.enabled_temp) data_records_graph.push({ id: strings.temperature, color: "hsl(183, 70%, 50%)", data: list_temp });
        if(currentComponent.state.enabled_humidity) data_records_graph.push({ id: strings.humidity, color: "hsl(281, 70%, 50%)", data: list_humidity });
        if(currentComponent.state.enabled_pressure) data_records_graph.push({ id: strings.pressure, color: "hsl(61, 70%, 50%)", data: list_pressure });

        currentComponent.setState({ data: data_records, data_graph: data_records_graph, data_pm10: list_pm1, data_pm2_5: list_pm2, data_temp: list_temp, data_humidity: list_humidity, data_pressure: list_pressure, loading: false});
      });
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  showDetails = () => {
    this.props.onOpenDetails(this.props.sensor);
  }

  handleTabChange = (event, value) => {
    this.setState({ value });
  };

  handleTabChangeIndex = index => {
    this.setState({ value: index });
  };

  openPicker = () => {
    this.picker.open();
  };

  minusDay = () => {
    var date = this.state.selected_date;
    this.setState({ selected_date: new Date(date.setTime(date.getTime() - 86400000 /* 1 Tag */))});
    this.loadSensorData();
  }

  plusDay = () => {
    var date = this.state.selected_date;
    this.setState({ selected_date: new Date(date.setTime(date.getTime() + 86400000 /* 1 Tag */))});
    this.loadSensorData();
  }

  handleDateChange = date => {
    this.setState({ selected_date: date });
    this.loadSensorData();
  }

  onZoomChange = (event, value) => {
    this.setState({ current_zoom: value });
  }

  onCheckedChange = name => event => {
    var data = [];
    if(name === "enabled_pm10" && event.target.checked) {
      data.push({ id: strings.pm1, color: "hsl(353, 70%, 50%)", data: this.state.data_pm10 });
    } else if(name !== "enabled_pm10" && this.state.enabled_pm10) {
      data.push({ id: strings.pm1, color: "hsl(353, 70%, 50%)", data: this.state.data_pm10 });
    }
    if(name === "enabled_pm2_5" && event.target.checked) {
      data.push({ id: strings.pm2, color: "hsl(87, 70%, 50%)", data: this.state.data_pm2_5 });
    } else if(name !== "enabled_pm2_5" && this.state.enabled_pm2_5) {
      data.push({ id: strings.pm2, color: "hsl(87, 70%, 50%)", data: this.state.data_pm2_5 });
    }
    if(name === "enabled_temp" && event.target.checked) {
      data.push({ id: strings.temperature, color: "hsl(183, 70%, 50%)", data: this.state.data_temp });
    } else if(name !== "enabled_temp" && this.state.enabled_temp) {
      data.push({ id: strings.temperature, color: "hsl(183, 70%, 50%)", data: this.state.data_temp });
    }
    if(name === "enabled_humidity" && event.target.checked) {
      data.push({ id: strings.humidity, color: "hsl(281, 70%, 50%)", data: this.state.data_humidity });
    } else if(name !== "enabled_humidity" && this.state.enabled_humidity) {
      data.push({ id: strings.humidity, color: "hsl(281, 70%, 50%)", data: this.state.data_humidity });
    }
    if(name === "enabled_pressure" && event.target.checked) {
      data.push({ id: strings.pressure, color: "hsl(61, 70%, 50%)", data: this.state.data_pressure });
    } else if(name !== "enabled_pressure" && this.state.enabled_pressure) {
      data.push({ id: strings.pressure, color: "hsl(61, 70%, 50%)", data: this.state.data_pressure });
    }
    this.setState({ [name]: event.target.checked, data_graph: data });
  }

  render() {
    const { classes, theme } = this.props;

    return (
      <Dialog fullScreen open={this.props.opened} onClose={this.props.onClose} TransitionComponent={Transition} >
        <AppBar className={classes.appBar}>
          <Toolbar>
            <Tooltip title={strings.show_sensor_details}>
              <IconButton color="inherit" onClick={this.showDetails} aria-label={strings.show_details}><SensorIcon /></IconButton>
            </Tooltip>
            <Typography variant="h6" color="inherit" className={classes.flex}>{this.props.sensor.name} - ChipID: {this.props.sensor.chip_id}</Typography>
            <Tooltip title={strings.close_window}>
              <IconButton color="inherit" onClick={this.props.onClose}><CloseIcon /></IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        {this.state.loading && <LinearProgress />}
        <Card className={classes.card}>
          <CardContent className={classes.card_content}>
            <Tooltip title={strings.day_before}>
              <IconButton onClick={this.minusDay}><KeyboardArrowLeft /></IconButton>
            </Tooltip>
            <MuiPickersUtilsProvider utils={DateFnsUtils} locale={deLocale}>
              <DatePicker value={this.state.selected_date} onChange={this.handleDateChange} className={classes.date_selection} showTodayButton disableFuture cancelLabel="Abbrechen" todayLabel="Heute" okLabel="OK" invalidLabel="Ungültige Eingabe" format="dd.MM.yyyy" ref={node => { this.picker = node; }}/>
            </MuiPickersUtilsProvider>
            <Tooltip title={strings.choose_another_date}>
              <IconButton onClick={this.openPicker}><Edit /></IconButton>
            </Tooltip>
            {this.state.selected_date >= this.state.default_date && <Tooltip title={strings.day_after}><IconButton onClick={this.plusDay} disabled><KeyboardArrowRight disabled/></IconButton></Tooltip>}
            {this.state.selected_date < this.state.default_date && <Tooltip title={strings.day_after}><IconButton onClick={this.plusDay}><KeyboardArrowRight /></IconButton></Tooltip>}
          </CardContent>
        </Card>
        <AppBar position="static" color="default">
          <Tabs value={this.state.value} onChange={this.handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
            <Tab label={strings.diagram} />
            <Tab label={strings.data_records} />
          </Tabs>
        </AppBar>
        <Scrollbars>
          <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'} index={this.state.value} onChangeIndex={this.handleTabChangeIndex} style={{overflowX: "hidden"}} animateHeight>
            <TabContainer dir={theme.direction} style={{overflowX: "hidden"}}>
              <Scrollbars style={{height: 600, overflowX: "hidden"}}>
                {this.state.data_graph !== [] && <div style={{height: 590, width: this.state.current_zoom}}><ResponsiveLine
                  data={this.state.data_graph}
                  margin={{
                      "top": 10,
                      "right": 50,
                      "bottom": 40,
                      "left": 30
                  }}
                  xScale={{
                      "type": 'time',
                      "format": 'native',
                      "precision": 'minute'
                  }}
                  yScale={{
                      "type": "linear",
                      "stacked": false,
                      "min": "auto",
                      "max": "auto"
                  }}
                  curve={this.state.smooth_curve ? (this.state.basis_curve ? "basis" : "cardinal") : "linear"}
                  axisBottom={{
                      "orient": "bottom",
                      "tickSize": 5,
                      "tickPadding": 5,
                      "tickRotation": 0,
                      "legend": strings.time_of_day,
                      "legendOffset": 35,
                      "format": '%H:%m',
                      "legendPosition": "middle"
                  }}
                  axisLeft={{
                      "orient": "left",
                      "tickSize": 5,
                      "tickPadding": 5,
                      "tickRotation": 0,
                      "legend": strings.measurement,
                      "legendOffset": -40,
                      "legendPosition": "middle"
                  }}
                  colors="category10"
                  lineWidth={1}
                  dotSize={this.state.disable_dots ? 0 : 5}
                  dotColor="inherit:darker(0.3)"
                  enableDotLabel={true}
                  dotLabel={this.state.enable_time ? (function(e){return"".concat(moment(e.x).format("HH:mm"),"")}) : ""}
                  dotLabelYOffset={-12}
                  dotBorderWidth={0}
                  animate={false}
                  motionStiffness={90}
                  motionDamping={15}
                  legends={[{
                          "anchor": "bottom-right",
                          "direction": "row",
                          "justify": false,
                          "translateX": 25,
                          "translateY": 40,
                          "itemsSpacing": 10,
                          "itemDirection": "left-to-right",
                          "itemWidth": 100,
                          "itemHeight": 18,
                          "itemOpacity": 0.75,
                          "symbolSize": 12,
                          "symbolShape": "circle",
                          "symbolBorderColor": "rgba(0, 0, 0, .5)",
                          "effects": [{
                              "on": "hover",
                              "style": {
                                  "itemBackground": "rgba(0, 0, 0, .03)",
                                  "itemOpacity": 1
                              }
                          }]
                        }
                    ]}
                /></div>}
              </Scrollbars>
              <FormControlLabel control={ <Checkbox checked={this.state.enabled_pm10} onChange={this.onCheckedChange('enabled_pm10')} value="pm10" color="primary" /> } label={strings.show_pm1} />
              <FormControlLabel control={ <Checkbox checked={this.state.enabled_pm2_5} onChange={this.onCheckedChange('enabled_pm2_5')} value="pm2_5" color="primary" /> } label={strings.show_pm2} />
              <FormControlLabel control={ <Checkbox checked={this.state.enabled_temp} onChange={this.onCheckedChange('enabled_temp')} value="temp" color="primary" /> } label={strings.show_temperature} />
              <FormControlLabel control={ <Checkbox checked={this.state.enabled_humidity} onChange={this.onCheckedChange('enabled_humidity')} value="humidity" color="primary" /> } label={strings.show_humidity} />
              <FormControlLabel control={ <Checkbox checked={this.state.enabled_pressure} onChange={this.onCheckedChange('enabled_pressure')} value="pressure" color="primary" /> } label={strings.show_pressure} />
              <Typography variant="h6">{strings.zoom_of_diagram_}</Typography>
              <br/>
              <Slider value={this.state.current_zoom} onChange={this.onZoomChange} min={1000} max={30000} step={1000} />
              <br/>
              <FormControlLabel control={ <Switch checked={this.state.enable_time} onChange={this.onCheckedChange('enable_time')} color="primary" /> } label={strings.show_time} />
              <FormControlLabel control={ <Switch checked={this.state.disable_dots} onChange={this.onCheckedChange('disable_dots')} color="primary" /> } label={strings.hide_dots} />
              <FormControlLabel control={ <Switch checked={this.state.smooth_curve} onChange={this.onCheckedChange('smooth_curve')} color="primary" /> } label={strings.enable_soft_curve} />
              {this.state.smooth_curve && <FormControlLabel control={ <Switch checked={this.state.basis_curve} onChange={this.onCheckedChange('basis_curve')} color="primary" /> } label={strings.enable_curve_smoothing} />}
              {!this.state.smooth_curve && <FormControlLabel control={ <Switch checked={this.state.basis_curve} onChange={this.onCheckedChange('basis_curve')} color="primary" disabled/> } label={strings.enable_curve_smoothing} />}
            </TabContainer>
            <TabContainer dir={theme.direction}>
              {this.state.data && <SensorDataTable data={this.state.data} />}
              {this.state.data === undefined && <Fragment>{strings.no_data}</Fragment>}
            </TabContainer>
          </SwipeableViews>
        </Scrollbars>
      </Dialog>
    );
  }
}

FullScreenDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenDetails: PropTypes.func.isRequired,
  sensor: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(FullScreenDialog);
