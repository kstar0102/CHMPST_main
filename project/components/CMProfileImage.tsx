import React, { useState } from 'react'
import { Image, View } from 'react-native'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'

const CMProfileImage = (props: any) => {
	const [showDefault, setShowDefault] = useState(true)
	const [error, setError] = useState(false)

	const { style = {}, imgURL, isUser = false, radius } = props

	const placeHolderImage = isUser ? require('../../assets/images/img_user_avatar.jpeg') : require('../../assets/images/img_photo_placeholder.jpeg')
	const image = showDefault ? placeHolderImage : (error ? placeHolderImage : (imgURL ? {uri: imgURL} : placeHolderImage))

	return (
		<View
			style={{
				...CMCommonStyles.profileImageContainer(radius),
				...style
			}}
		>
			<Image
				style={CMCommonStyles.profileImage}
				source={image}
				onLoadEnd={() => setShowDefault(false)}
				onError={() => setError(true)}
				resizeMode='cover'
			/>
		</View>
	)
}

export default CMProfileImage