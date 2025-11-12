import React from 'react'
import DropDownPicker from 'react-native-dropdown-picker'
import CMConstants from '../CMConstants'
import CMUtils from '../utils/CMUtils'

const CMDropDownPicker = (props: any) => {
    const { isOpened, themeMode, defaultStyle, defaultDropDownContainerStyle, defaultContainerStyle = {}, fontSize = CMConstants.fontSize.normal } = props
    
    return (
        <DropDownPicker
            {...props}
            autoScroll={true}
            style={[defaultStyle, {zIndex: isOpened === true ? 10 : 0, backgroundColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.white : CMConstants.color.darkGrey, borderColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.lightGrey : CMConstants.color.grey}]}
            dropDownContainerStyle={[defaultDropDownContainerStyle, {backgroundColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.white : CMConstants.color.darkGrey, borderColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.lightGrey : CMConstants.color.grey}]}
            textStyle={{color: CMUtils.isLightMode(themeMode) ? CMConstants.color.black : CMConstants.color.white, fontFamily: CMConstants.font.regular, fontSize: fontSize}}
            arrowIconStyle={{tintColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.black : CMConstants.color.white}}
            tickIconStyle={{tintColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.black : CMConstants.color.white}}
            containerStyle={[defaultContainerStyle, CMUtils.isIOS ? {zIndex: isOpened === true ? 10000 : 0} : {}]}
            listMessageTextStyle={{color: CMConstants.color.lightGrey}}
            listMode='SCROLLVIEW'
            scrollViewProps={{nestedScrollEnabled: true}}
            searchTextInputStyle={{color: CMUtils.isLightMode(themeMode) ? CMConstants.color.black : CMConstants.color.white, borderColor: CMUtils.isLightMode(themeMode) ? CMConstants.color.black : CMConstants.color.white}}
        />
    )
}

export default CMDropDownPicker