import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';
import fire from '../fire'
import strings from '../strings'

class DialogRemoveSensor extends React.Component {
  onRemove = () => {
    var timestamp = Math.floor(Date.now());
    var data_new = [];
    this.props.user_data.map(sensor => {
      if(sensor.chip_id !== this.props.chip_id) data_new.push(sensor);
      return true;
    });
    var obj = { time: timestamp, device: "web", data: data_new }
    fire.database().ref('sync/' + this.props.sync_key).set(obj)

    this.props.onClose(1);
  }

  render() {
    return (
      <Dialog open={this.props.opened} onClose={this.props.onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description" >
        <DialogTitle id="alert-dialog-title">{strings.remove_sensor}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{strings.remove_sensor_message_1} <b>{this.props.chip_id}</b> {strings.remove_sensor_message_2}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.onClose} color="primary" autoFocus>{strings.cancel}</Button>
          <Button onClick={this.onRemove} color="primary">{strings.remove}</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

DialogRemoveSensor.propTypes = {
  sync_key: PropTypes.string.isRequired,
  user_data: PropTypes.array.isRequired,
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  chip_id: PropTypes.string.isRequired,
};

export default DialogRemoveSensor;
