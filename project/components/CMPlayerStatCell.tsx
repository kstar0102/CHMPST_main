import React from 'react'
import { View, ViewStyle, TextStyle, Text } from 'react-native'
import CMConstants from '../CMConstants'
import CMRipple from './CMRipple'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMProfileImage from './CMProfileImage'

const CMPlayerStatCell = (props: any) => {
	const themeMode = CMConstants.themeMode.light

	const { playerStat = {}, index } = props

	return (
		<CMRipple
			containerStyle={styles.cell(index)}
			onPress={() => {props.onPress()}}
		>
			<CMProfileImage
				radius={50}
				style={{
					marginLeft: CMConstants.space.smallEx
				}}
				imgURL={playerStat?.player?.avatar??""}
				isUser={true}
			/>
			<View
				style={{flex: 1, marginLeft: CMConstants.space.smallEx}}
			>
				<Text
					style={CMCommonStyles.label(themeMode)}
					numberOfLines={2}
				>
					{playerStat?.player?.name??""}
				</Text>
				<View style={{flexDirection: 'row', marginTop: 4}}>
					<CMProfileImage
						radius={20}
						imgURL={playerStat?.team?.avatar??""}
					/>
					<View
						style={{flex: 1, marginLeft: 4, justifyContent: 'center'}}
					>
						<Text
							style={CMCommonStyles.textSmallEx(themeMode)}
							numberOfLines={1}
						>
							{playerStat?.team?.name??""}
						</Text>
					</View>
				</View>
			</View>
			<Text style={styles.item(themeMode)}>
				{playerStat?.points??""}
			</Text>
			<Text style={styles.item(themeMode)}>
				{playerStat?.assists??""}
			</Text>
			<Text style={styles.item(themeMode)}>
				{playerStat?.rebounds??""}
			</Text>
			<Text style={styles.item(themeMode)}>
				{playerStat?.blocks??""}
			</Text>
 			<Text style={styles.item(themeMode)}>
				{playerStat?.steals??""}
			</Text>
        </CMRipple>
	)
}

const styles = {
	cell: (index: number): ViewStyle => ({
		paddingVertical: CMConstants.space.smallEx,
		alignItems: 'center',
		flexDirection: 'row',
		backgroundColor: index <=3 ? CMConstants.color.lightGrey2 : CMConstants.color.lightGrey1,
		borderWidth: 1,
		borderRadius: CMConstants.radius.normal,
		borderColor: CMConstants.color.lightGrey,
		overflow: 'hidden'
	}),
	item: (themeMode: string): TextStyle => ({
		...CMCommonStyles.label(themeMode),
		width: 40,
		textAlign: 'center'
	})
}

export default CMPlayerStatCell