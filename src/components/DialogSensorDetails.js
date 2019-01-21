import React from 'react';
import PropTypes from 'prop-types';
import request from 'superagent'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import moment from 'moment';

class DialogSensorDetails extends React.Component {
  state = {
    public: false,
    creation_date: "Laden...",
    lat: "Laden...",
    lng: "Laden...",
    alt: "Laden...",
  };

  constructor(props) {
    super(props)

    this.loadSensorDetails();
  }

  loadSensorDetails = () => {
    //Serveranfrage machen
    let currentComponent = this;
    request.post('https://h2801469.stratoserver.net/ServerScript.php')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({command: "issensorexisting", chip_id: this.props.chip_id})
      .end(function(err, res) {
        var result = res.text.trim();
        if(result === "1") {
          request.post('https://h2801469.stratoserver.net/ServerScript.php')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({command: "getsensorinfo", chip_id: currentComponent.props.chip_id})
            .end(function(err, res) {
              var result = res.text.trim();
              var obj = JSON.parse(result)[0];
              var alt = obj.alt + "m";

              currentComponent.setState({
                creation_date: moment.unix(obj.creation_date).format("DD.MM.YYYY"),
                public: true,
                lat: obj.lat,
                lng: obj.lng,
                alt: alt,
              });
            });
        } else {
          currentComponent.setState({
            creation_date: "-",
            public: false,
            lat:  "-",
            lng:  "-",
            alt:  "-",
          });
        }
      });
  }

  render() {
    return (
      <Dialog open={this.props.opened} onClose={this.props.onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description" >
        <DialogTitle id="alert-dialog-title">{"Sensor Details"}</DialogTitle>
        <DialogContent>
          <table width="350">
            <tbody>
              <tr>
                <td><b>Anzeigename:</b></td>
                <td align="right">{this.props.name}</td>
              </tr>
              <tr>
                <td><b>Chip-ID:</b></td>
                <td align="right">{this.props.chip_id}</td>
              </tr>
              <tr>
                <td><b>Öffentlich:</b></td>
                <td align="right">{this.state.public ? "Ja" : "Nein"}</td>
              </tr>
              <tr>
                <td><b>Online seit:</b></td>
                <td align="right">{this.state.creation_date}</td>
              </tr>
              <tr>
                <td><b>Längengrad:</b></td>
                <td align="right">{this.state.lat}</td>
              </tr>
              <tr>
                <td><b>Breitengrad:</b></td>
                <td align="right">{this.state.lng}</td>
              </tr>
              <tr>
                <td><b>Montagehöhe:</b></td>
                <td align="right">{this.state.alt}</td>
              </tr>
            </tbody>
          </table>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.onClose} color="primary" autoFocus>OK</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

DialogSensorDetails.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  chip_id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

export default DialogSensorDetails;