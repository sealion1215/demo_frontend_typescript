import React, { PureComponent } from 'react';
import { Camera, CameraCapturedPicture } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import config from './config';

interface IOCRProperty {}
interface IOCRState {
  hasCameraPermission: boolean,
  type: any,
  cameraReady: boolean,
  useSavedPicture: boolean,
  textContent: string
}
export default class OCRApp extends PureComponent<IOCRProperty, IOCRState> {
  camera!: Camera | null;

  constructor(props: Readonly<{}>) {
    super(props);
    this.cameraReady = this.cameraReady.bind(this);
    this.snap = this.snap.bind(this);
    this.state = {
      hasCameraPermission: false,
      type: Camera.Constants.Type.back,
      cameraReady: false,
      useSavedPicture: true,
      textContent: 'Hello World 32!'
    };
  }

  styles = StyleSheet.create({
    cameraInterior: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end'
    },
    buttonExterior: {
      borderWidth: 2,
      borderRadius:0.5,
      borderColor: 'white',
      height: 50,
      width:50,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    buttonInterior: {
      borderWidth: 2,
      borderRadius:0.5,
      borderColor: 'white',
      height: 40,
      width:40,
      backgroundColor: 'white'
    },
    textStyle: {
      alignSelf: 'center',
      fontSize: 30
    }
  });
  
  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' }, () => console.log(this.state));
  }

  cameraReady = () => {
    this.setState({cameraReady: true}, () => console.log("Camera is ready"));
  }

  snap = async () => {
    console.log('taking picture');
    const { cameraReady, useSavedPicture } = this.state;
    if (this.camera && cameraReady) {
      const options = {
        quality: 1,
        base64: true
      }
      const picture = await this.camera.takePictureAsync(options);
      let imageToServer = await this.convertImageToBase64(useSavedPicture, picture);
      console.log(picture.uri===imageToServer);
      let url = config.SERVER_BASE_URL+'/ocrreaders/english';
      fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageToServer,
          isBase64String: true
          // isBase64String: !useSavedPicture
        })
      }).then(async response => {
        let json = await response.json();
        this.setState({ textContent: json.result });
        console.log(json);
      }).catch(error => {
        console.log('error: ');
        console.log(error);
      })
    }
  }

  convertImageToBase64 = async (useSavedPicture: boolean, picture: CameraCapturedPicture) => {
    if (useSavedPicture) {
      return new Promise<string>(resolve => {
        const canvas = document.createElement('canvas');
        const localImage = new Image();
        localImage.src = require('./test_images/A.jpg');
        localImage.onload = () => {
          canvas.width = localImage.width;
          canvas.height = localImage.height;
          canvas.getContext('2d')?.drawImage(localImage, 0, 0);
          resolve(canvas.toDataURL());
        }
      });
    } else {
      return picture.uri;
    }  
  }

  render() {
    const { type, textContent } = this.state;
    return (
      <View style={{flex: 1}}>
        <Camera
          ref={(ref: any) => this.camera = ref}
          style={{flex: 1}}
          type={type}
          flashMode={Camera.Constants.FlashMode.auto}
          onCameraReady={this.cameraReady}
        >
          <View style={this.styles.cameraInterior}>
            <TouchableOpacity 
              style={{alignSelf: 'center'}}
              onPress={this.snap}
            >
              <View style={this.styles.buttonExterior}>
                <View style={this.styles.buttonInterior}/>
              </View>
            </TouchableOpacity>
          </View>
        </Camera>
        <View style={{flex: 0.125}}>
          <Text style={this.styles.textStyle}>
            {textContent}
          </Text>
        </View>
      </View>
    );
  }
}