import React from 'react'
import { View, Text, TextStyle } from 'react-native'
import CMConstants from '../CMConstants'
import CMRipple from './CMRipple'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMProfileImage from './CMProfileImage'

const CMStandingCell = (props: any) => {
	const themeMode = CMConstants.themeMode.light

	const { standing = {} } = props

	return (
		<CMRipple
			containerStyle={styles.cell}
			onPress={() => {props.onPress()}}
		>
			<CMProfileImage
				radius={40}
				style={{marginLeft: CMConstants.space.smallEx}}
				imgURL={standing?.team?.avatar??""}
			/>
			<View
				style={{flex: 1, marginLeft: CMConstants.space.smallEx}}
			>
				<Text
					style={CMCommonStyles.label(themeMode)}
					numberOfLines={2}
				>
					{standing?.team?.name??""}
				</Text>
			</View>
			<Text style={styles.item(themeMode)}>
				{standing?.game??""}
			</Text>
			<Text style={styles.item(themeMode)}>
				{standing?.win??""}
			</Text>
			<Text style={styles.item(themeMode)}>
				{standing?.lose??""	}
			</Text>
		</CMRipple>
	)
}

const styles = {
	cell: {
		paddingVertical: CMConstants.space.smallEx,
		alignItems: 'center',
		flexDirection: 'row',
		backgroundColor: CMConstants.color.lightGrey1,
		borderWidth: 1,
		borderRadius: CMConstants.radius.normal,
		borderColor: CMConstants.color.lightGrey,
		overflow: 'hidden'
	},
	item: (themeMode: string): TextStyle => ({
		...CMCommonStyles.label(themeMode),
		width: 50,
		textAlign: 'center'
	})
}

export default CMStandingCell