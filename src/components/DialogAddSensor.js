import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import request from 'superagent'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import { CirclePicker } from 'react-color'
import { LocationPickerDialog } from './index'
import green from '@material-ui/core/colors/green';
import fire from '../fire'

const styles = theme => ({
  buttonProgress: {
    position: 'absolute',
    color: green[500],
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});

class DialogAddSensor extends React.Component {
  state = {
    active_step: 1,
    chip_id: "",
    next_disabled: true,
    loading: false,
    chip_id_error: false,
    error_desc: "",
    sensor_name: "",
    color: "",
    lat: "",
    lng: "",
    alt: "",
    location_picker_open: false,
  };

  handleNext = (step) => {
    if(step === 1) {
      this.setState({ loading: true });
      //Existiert eine ID bereits
      let currentComponent = this;
      request.post('https://h2801469.stratoserver.net/ServerScript.php')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({command: "issensordataexisting", chip_id: this.state.chip_id})
        .end(function(err, res) {
          var result = res.text.trim();
          if(result === "true") {
            currentComponent.setState({ loading: false, active_step: 2, next_disabled: true });
          } else {
            currentComponent.setState({ loading: false, chip_id_error: true, next_disabled: true, error_desc: "Sie haben entweder die falsche Chip-ID angegeben oder in der Konfiguration Ihres Sensors ist die Option 'Senden an Feinstaub-App' nicht aktiviert. Nachdem die Option aktiviert ist, kann es bis zu 10 Minuten dauern, bis Daten auf dem Server ankommen." });
          }
        });
    } else if(step === 3) {
      this.addSensor();
    } else {
      this.setState({ active_step: this.state.active_step +1, next_disabled: true });
    }
  };

  handleBack = () => {
    this.setState({ active_step: this.state.active_step -1 });
  };

  chipIDChange = (event) => {
    var next_disabled = event.target.value.length === 0;
    this.setState({ chip_id: event.target.value, chip_id_error: false, error_desc: "", next_disabled: next_disabled });
  }

  nameChange = (event) => {
    var next_disabled = event.target.value.length === 0 || this.state.color === "";
    this.setState({ sensor_name: event.target.value, next_disabled: next_disabled });
  }

  colorChange = (color, event) => {
    var next_disabled = this.state.sensor_name.length === 0;
    this.setState({ color: color.hex, next_disabled: next_disabled });
  }

  chooseLocation = () => {
    this.setState({ location_picker_open: true });
  }

  locationChange = (position, address) => {
    console.log(address);
    console.log(position);
    this.setState({ location_picker_open: false });
  }

  latChanged = (event) => {
    var next_disabled = event.target.value.length === 0 || this.state.lng.length === 0 || this.state.alt.length === 0;
    this.setState({ lat: event.target.value, next_disabled: next_disabled });
  }

  lngChanged = (event) => {
    var next_disabled = this.state.lat.length === 0 || event.target.value.length === 0 || this.state.alt.length === 0;
    this.setState({ lng: event.target.value, next_disabled: next_disabled });
  }

  altChanged = (event) => {
    var next_disabled = this.state.lat.length === 0 || this.state.lng.length === 0 || event.target.value.length === 0;
    this.setState({ alt: event.target.value, next_disabled: next_disabled });
  }

  addSensor = () => {
    this.setState({ loading: true });

    if(this.props.logged_in) {
      //Beim Nutzer hinzufügen
      var timestamp = Math.floor(Date.now());
      var data_new = this.props.user_data;
      data_new.push({ chip_id: this.state.chip_id, color: this.state.color, fav: false, name: this.state.sensor_name });
      var obj = { time: timestamp, device: "web", data: data_new }
      fire.database().ref('sync/' + this.props.sync_key).set(obj);
    }

    //Auf dem Server hinzufügen
    let currentComponent = this;
    request.post('https://h2801469.stratoserver.net/ServerScript.php')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({command: "addsensor", chip_id: this.state.chip_id, lat: this.state.lat, lng: this.state.lng, alt: this.state.alt})
      .end(function(err, res) {
        var result = res.text.trim();
        console.log(result);
        if(result === 0) result = 2;
        //currentComponent.props.onSensorAdded();
        currentComponent.props.onClose(parseInt(result));
      });
  }

  addSensorPrivate = () => {
    this.setState({ loading: true });

    //Beim Nutzer hinzufügen
    var timestamp = Math.floor(Date.now());
    var data_new = this.props.user_data;
    data_new.push({ chip_id: this.state.chip_id, color: this.state.color, fav: false, name: this.state.sensor_name });
    var obj = { time: timestamp, device: "web", data: data_new }
    fire.database().ref('sync/' + this.props.sync_key).set(obj)
    this.props.onClose(1);
  }

  render() {
    const {classes} = this.props;

    return (
      <Fragment>
        <Dialog open={this.props.opened} fullWidth onClose={this.props.onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description" >
          <DialogTitle id="alert-dialog-title">{"Sensor hinzufügen"}</DialogTitle>
          <DialogContent>
            <Stepper activeStep={this.state.active_step -1} orientation="vertical">
              {/* Step 1 */}
              <Step key={'Chip-ID angeben'}>
                <StepLabel>{'Chip-ID angeben'}</StepLabel>
                <StepContent>
                  {/* Content */}
                  <div>
                    <Typography>Bitte geben Sie die Chip-ID Ihres Sensors in das Feld unten ein. Sie finden die ID in der Konfiguration Ihres Sensors. Falls Sie die Sensor-ID dennoch nicht finden sollten, finden Sie auf unserer <a href="https://mrgames13.jimdo.com/feinstaub-app/faq/#6" target="blank">FAQ-Seite</a> einen Eintrag.</Typography>
                    <TextField value={this.state.chip_id} label="Chip-ID" type="number" error={this.state.chip_id_error} onChange={this.chipIDChange} variant="outlined" style={{marginTop: 15}} />
                    {this.state.error_desc !== "" && <Typography color="error" style={{marginTop: 15}}>{this.state.error_desc}</Typography>}
                  </div>
                  {/* Buttons */}
                  <Button disabled={true} onClick={this.handleBack} style={{marginTop: 15, marginRight: 15}}>Zurück</Button>
                  <span style={{position: "relative", width: 80}}>
                    <Button variant="contained" color="primary" disabled={this.state.loading || this.state.next_disabled} style={{marginTop: 15}} onClick={() => this.handleNext(1)}>{'Weiter'}</Button>
                    {this.state.loading && <CircularProgress size={24} style={{marginTop: 0}} className={classes.buttonProgress} />}
                  </span>
                </StepContent>
              </Step>
              {/* Step 2 */}
              <Step key={'Basisdaten angeben'}>
                <StepLabel>{'Basisdaten angeben'}</StepLabel>
                <StepContent>
                  {/* Content */}
                  <div>
                    <Typography>Bitte vergeben Sie für Ihren Sensor einen Anzeigenamen und bestimmen Sie eine Farbe für den Sensor innerhalb der Diagramme.</Typography>
                    <TextField label="Anzeigename" value={this.state.sensor_name} style={{width: 360, marginTop: 15, marginBottom: 15}} onChange={this.nameChange} variant="outlined"/>
                    <CirclePicker color={this.state.color} width="380px" onChangeComplete={this.colorChange} />
                  </div>
                  {/* Buttons */}
                  <Button onClick={this.handleBack} style={{marginTop: 15, marginRight: 15}}>Zurück</Button>
                  <span style={{position: "relative", width: 80}}>
                    <Button variant="contained" color="primary" disabled={this.state.next_disabled} style={{marginTop: 15}} onClick={() => this.handleNext(2)}>{'Weiter'}</Button>
                  </span>
                </StepContent>
              </Step>
              {/* Step 3 */}
              <Step key={'Auf die Karte bringen'}>
                <StepLabel>{'Auf die Karte bringen'}</StepLabel>
                <StepContent>
                  {/* Content */}
                  <div>
                    <Typography>Um Ihren Sensor auf die Karte zu bekommen, müssen Sie die genaue Position des Sensors und die Montagehöhe <b>über dem Boden</b> angeben.<br/><b>HINWEIS:</b> Diese Daten können später nur noch geändert werden, indem Sie per E-Mail mit uns in <a href="mailto:mrgames@outlook.de">Kontakt</a> treten.</Typography>
                    <Tooltip title="Bald verfügbar">
                      <Button variant="outlined" color="primary" _onClick={this.chooseLocation} style={{margin: 10, width: 440}}>Position des Sensors wählen</Button>
                    </Tooltip>
                    <span>
                      <TextField label="Längengrad" style={{margin: 10}} type="number" onChange={this.latChanged} variant="outlined" />
                      <TextField label="Breitengrad" style={{margin: 10}} type="number" onChange={this.lngChanged} variant="outlined" />
                    </span>
                    <TextField label="Montagehöhe (in Meter)" style={{margin: 10}} type="number" onChange={this.altChanged} variant="outlined" />
                  </div>
                  {/* Buttons */}
                  <Button onClick={this.handleBack} style={{marginTop: 15, marginRight: 15}}>Zurück</Button>
                  {this.props.logged_in && <Button variant="outlined" onClick={this.addSensorPrivate} style={{marginTop: 15, marginRight: 15}}>Überspringen</Button>}
                  <span style={{position: "relative", width: 80}}>
                    <Button variant="contained" color="primary" disabled={this.state.loading || this.state.next_disabled} style={{marginTop: 15}} onClick={() => this.handleNext(3)}>{'Sensor hinzufügen'}</Button>
                    {this.state.loading && <CircularProgress size={24} style={{marginTop: 0}} className={classes.buttonProgress} />}
                  </span>
                </StepContent>
              </Step>
            </Stepper>
          </DialogContent>
        </Dialog>
        {this.state.location_picker_open && <LocationPickerDialog onChoose={this.locationChange}/>}
      </Fragment>
    );
  }
}

DialogAddSensor.propTypes = {
  sync_key: PropTypes.string.isRequired,
  user_data: PropTypes.array.isRequired,
  opened: PropTypes.bool.isRequired,
  logged_in: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSensorAdded: PropTypes.func.isRequired,
};

export default withStyles(styles)(DialogAddSensor);;