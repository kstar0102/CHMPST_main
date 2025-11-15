import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CMNavigationProps from '../navigation/CMNavigationProps';
import CMCommonStyles from '../styles/CMCommonStyles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMRipple from '../components/CMRipple';
import CMConstants from '../CMConstants';
import CMLoadingDialog from '../dialog/CMLoadingDialog';
import { TextInput } from 'react-native-gesture-handler';
import CMImagePicker from '../helper/CMImagePicker';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper';
import CMUtils from '../utils/CMUtils';
import { getAuth } from '@react-native-firebase/auth';
import CMGlobal from '../CMGlobal';
import CMProgressiveImage from '../components/CMProgressiveImage';
import CMPermissionHelper from '../helper/CMPermissionHelper';

const CMEditLeagueScreen = ({ navigation, route }: CMNavigationProps) => {
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const [profileImagePath, setProfileImagePath] = useState(
    route.params.league?.avatar ?? '',
  );
  const [profileImageChanged, setProfileImageChanged] = useState(false);
  const [name, setName] = useState(route.params.league?.name ?? '');
  const [maxTeamSize, setMaxTeamSize] = useState(
    route.params.league?.maxTeamSize?.toString() ?? '',
  );
  const [inviteId, setInviteId] = useState(route.params.league?.inviteId ?? '');
  const [instagramUrl, setInstagramUrl] = useState(route.params.league?.instagramUrl ?? '');
  const [city, setCity] = useState(route.params.league?.city ?? '');
  const [state, setState] = useState(route.params.league?.state ?? '');
  const [country, setCountry] = useState(route.params.league?.country ?? '');
  const [createLabel, setCreateLabel] = useState('Create League');
  const [promoCode, setPromoCode] = useState('');

  const themeMode = CMConstants.themeMode.light;

  // Instagram URL validation function
  const isValidInstagramUrl = (url: string): boolean => {
    if (!url || url.trim().length === 0) {
      return true; // Empty URL is valid (optional field)
    }
    
    const trimmedUrl = url.trim();
    
    // Instagram URL patterns - more flexible to handle various Instagram URLs
    const instagramPatterns = [
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?.*$/, // Full Instagram URLs with any path
      /^@[a-zA-Z0-9._]+$/, // Handle @username format
      /^[a-zA-Z0-9._]+$/ // Handle just username
    ];
    
    return instagramPatterns.some(pattern => pattern.test(trimmedUrl));
  };

  const formatInstagramUrl = (url: string): string => {
    if (!url || url.trim().length === 0) {
      return '';
    }
    
    const trimmedUrl = url.trim();
    
    // If it's just a username (no @, no URL), add @
    if (/^[a-zA-Z0-9._]+$/.test(trimmedUrl)) {
      return `@${trimmedUrl}`;
    }
    
    // If it's @username, keep as is
    if (/^@[a-zA-Z0-9._]+$/.test(trimmedUrl)) {
      return trimmedUrl;
    }
    
    // If it's a full URL, keep as is
    if (/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/.test(trimmedUrl)) {
      return trimmedUrl;
    }
    
    return trimmedUrl;
  };

  useEffect(() => {
    if (route.params.isEdit) {
      navigation.setOptions({ title: 'Edit League' });
      setCreateLabel('Update League');
      
      // Check permissions when editing
      const checkPermissions = async () => {
        const league = route.params.league;
        if (league && league.id) {
          const canEdit = await CMPermissionHelper.canEditLeague(league.id, league);
          if (!canEdit) {
            CMPermissionHelper.showPermissionDenied(navigation);
          }
        }
      };
      checkPermissions();
    } else {
      navigation.setOptions({ title: 'Create League' });
    }
  }, []);

  useEffect(() => {
    if (route.params.isEdit) {
      setCreateLabel('Update League');
    } else {
      setCreateLabel('Create League');
    }
  }, [route.params.isEdit]);

  const onBtnProfileImage = () => {
    CMImagePicker.showImagePicker(1, (isSuccess: boolean, response: any) => {
      if (!isSuccess) {
        return;
      }

      setProfileImageChanged(true);
      setProfileImagePath(response.path);
    });
  };

  const onBtnCreateLeague = () => {
    if (name.trim().length == 0) {
      CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterLeagueName);
      return;
    }
    const size = parseInt(maxTeamSize);
    if (!CMUtils.isNumeric(size)) {
      CMAlertDlgHelper.showAlertWithOK('Please enter a valid max team size.');
      return;
    }
    if (size < 2) {
      CMAlertDlgHelper.showAlertWithOK('Max team size should be minimum 2.');
      return;
    }
    if (inviteId.trim().length == 0) {
      CMAlertDlgHelper.showAlertWithOK('Please enter invite code.');
      return;
    }
    if (!isValidInstagramUrl(instagramUrl)) {
      CMAlertDlgHelper.showAlertWithOK('Please enter a valid Instagram URL, username, or @username.');
      return;
    }

    const isEdit = route.params.isEdit;
    const leagueId = isEdit ? route.params.league.id : CMFirebaseHelper.getNewDocumentId(
      CMConstants.collectionName.league,
    );
    
    const updatedLeague: { [name: string]: any } = {
      id: leagueId,
      name: name,
      maxTeamSize: size,
      inviteId: inviteId,
      instagramUrl: formatInstagramUrl(instagramUrl),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
    };

    // Only set adminId and teamsId for new leagues
    if (!isEdit) {
      updatedLeague.adminId = getAuth().currentUser?.uid;
      updatedLeague.teamsId = [CMGlobal.user.teamId];
    }

    const postUploadImage = async () => {
      if (isEdit) {
        // Check permissions before updating
        const canEdit = await CMPermissionHelper.canEditLeague(leagueId, route.params.league);
        if (!canEdit) {
          setLoading(false);
          CMPermissionHelper.showPermissionDenied(navigation);
          return;
        }

        CMFirebaseHelper.updateLeague(
          leagueId,
          updatedLeague,
          (response: { [name: string]: any }) => {
            setLoading(false);
            setProfileImageChanged(false);
            if (response.isSuccess) {
              CMAlertDlgHelper.showAlertWithOK('League updated successfully!', () => {
                navigation.pop();
              });
            } else {
              CMAlertDlgHelper.showAlertWithOK(response.value);
            }
          },
        );
      } else {
        CMFirebaseHelper.createLeague(
          leagueId,
          updatedLeague,
          (response: { [name: string]: any }) => {
            setLoading(false);
            setProfileImageChanged(false);
            if (response.isSuccess) {
              CMAlertDlgHelper.showAlertWithOK(response.value, () => {
                navigation.pop();
              });
            } else {
              CMAlertDlgHelper.showAlertWithOK(response.value);
            }
          },
        );
      }
    };

    const postPurchase = () => {
      setLoading(true);
      if (profileImageChanged) {
        CMFirebaseHelper.uploadImage(
          profileImagePath,
          `league_avatar/${leagueId}.jpg`,
        ).then(response => {
          if (response.isSuccess) {
            updatedLeague['avatar'] = response.value;
          }
          postUploadImage();
        });
      } else {
        postUploadImage();
      }
    };

    // Skip purchase logic for edit mode
    if (isEdit) {
      postPurchase();
    } else {
      if (promoCode.trim().length > 0) {
        setLoading(true);
        CMFirebaseHelper.getPromoCodes(
          promoCode,
          (response: { [name: string]: any }) => {
            if (response.isSuccess) {
              CMFirebaseHelper.updatePromoCode(
                response.value[0].id,
                { usedBy: getAuth().currentUser?.uid },
                (response: { [name: string]: any }) => {
                  setLoading(false);
                  if (response.isSuccess) {
                    postPurchase();
                  } else {
                    CMAlertDlgHelper.showAlertWithOK(
                      'Failed to load promo code.',
                    );
                  }
                },
              );
            } else {
              setLoading(false);
              CMAlertDlgHelper.showAlertWithOK(response.value);
            }
          },
        );
      } else {
        // Free league creation without IAP
        postPurchase();
      }
    }
  };

  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      <CMLoadingDialog visible={loading} />
      <KeyboardAwareScrollView
        style={{ marginBottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={CMCommonStyles.body}
      >
        <View>
          <View
            style={{
              width: 180,
              height: 180,
              alignSelf: 'center',
              marginVertical: CMConstants.space.normal,
            }}
          >
            <CMRipple
              containerStyle={CMCommonStyles.profileImageContainer(180)}
              onPress={onBtnProfileImage}
            >
              <CMProgressiveImage
                style={CMCommonStyles.profileImage}
                imgURL={profileImagePath}
              />
            </CMRipple>
            <CMRipple
              containerStyle={{
                ...CMCommonStyles.circle(CMConstants.height.icon + 8),
                backgroundColor: CMConstants.color.lightGrey,
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                bottom: 12,
                right: 12,
              }}
              onPress={onBtnProfileImage}
            >
              <Ionicons
                name={'ellipsis-horizontal'}
                size={CMConstants.height.icon}
                color={CMConstants.color.black}
              />
            </CMRipple>
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Name</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={name}
            onChangeText={text => setName(text)}
            placeholder=""
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Max Team Size</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={maxTeamSize}
            onChangeText={text => setMaxTeamSize(text)}
            placeholder=""
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Invite Code</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={inviteId}
            onChangeText={text => setInviteId(text)}
            placeholder=""
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Instagram URL (Optional)</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={instagramUrl}
            onChangeText={text => setInstagramUrl(text)}
            placeholder="e.g., @username, username, or https://instagram.com/username"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>City</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={city}
            onChangeText={text => setCity(text)}
            placeholder="Enter city name"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>State</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={state}
            onChangeText={text => setState(text)}
            placeholder="Enter state"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Country</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            value={country}
            onChangeText={text => setCountry(text)}
            placeholder="Enter country name"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          {!route.params.isEdit && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: CMConstants.space.normal,
                }}
              >
                <Text style={CMCommonStyles.label(themeMode)}>Promo Code</Text>
              </View>
              <TextInput
                style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
                value={promoCode}
                onChangeText={text => setPromoCode(text)}
                placeholder=""
                placeholderTextColor={CMConstants.color.grey}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                underlineColorAndroid="#f000"
                submitBehavior="submit"
              />
            </>
          )}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.normal,
            }}
          >
            <CMRipple
              containerStyle={{ ...CMCommonStyles.buttonMain, flex: 1 }}
              onPress={onBtnCreateLeague}
            >
              <Text style={CMCommonStyles.buttonMainText}>{createLabel}</Text>
            </CMRipple>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = {};

export default CMEditLeagueScreen;
