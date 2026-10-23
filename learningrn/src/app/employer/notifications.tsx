import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

/*
|--------------------------------------------------------------------------
| EMPLOYER BLUE THEME
|--------------------------------------------------------------------------
*/

const BLUE = '#1769AA';
const DARK_BLUE = '#123B5D';
const LIGHT_BLUE = '#E8F3FC';
const BACKGROUND = '#F5FAFE';
const BORDER = '#D5E6F2';
const WHITE = '#FFFFFF';
const MUTED = '#6B7C8F';
const RED = '#C62828';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type NotificationType =
  | 'application'
  | 'request'
  | 'message'
  | 'verification'
  | 'system';

type NotificationItem = {
  id: number;
  jobId: number | null;
  jobTitle: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
}

function formatTime(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(
    value.replace(' ', 'T')
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getNotificationIcon(
  type: NotificationType
) {
  switch (type) {
    case 'application':
      return 'briefcase';

    case 'request':
      return 'person-add';

    case 'message':
      return 'chatbubble';

    case 'verification':
      return 'shield-checkmark';

    default:
      return 'notifications';
  }
}

/*
|--------------------------------------------------------------------------
| NOTIFICATION CARD
|--------------------------------------------------------------------------
*/

type NotificationCardProps = {
  notification: NotificationItem;
  onPress: () => void;
  onDelete: () => void;
};

function NotificationCard({
  notification,
  onPress,
  onDelete,
}: NotificationCardProps) {
  const icon = getNotificationIcon(
    notification.type
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.notificationCard,
        !notification.read &&
          styles.unreadCard,
      ]}
    >
      {/* ICON */}
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon as any}
          size={21}
          color={BLUE}
        />
      </View>

      {/* CONTENT */}
      <View style={styles.notificationContent}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.notificationTitle,
              !notification.read &&
                styles.unreadTitle,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>

          {!notification.read && (
            <View style={styles.unreadDot} />
          )}
        </View>

        <Text
          style={styles.notificationMessage}
          numberOfLines={3}
        >
          {notification.message}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.timeText}>
            {formatTime(notification.time)}
          </Text>

          {notification.type ===
            'application' &&
            notification.jobId !== null &&
            notification.jobId > 0 && (
              <Text
                style={
                  styles.viewApplicantsText
                }
              >
                View Applicants →
              </Text>
            )}
        </View>
      </View>

      {/* DELETE */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={RED}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN SCREEN
|--------------------------------------------------------------------------
*/

export default function EmployerNotificationsScreen() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | PARAMS
  |--------------------------------------------------------------------------
  */

  const params =
    useLocalSearchParams<{
      userId?: string | string[];
      fullName?: string | string[];
    }>();

  const userId = getParam(params.userId);
  const fullName = getParam(params.fullName);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | FETCH NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const fetchNotifications =
    useCallback(async () => {
      if (!userId) {
        console.warn(
          'No employer userId provided.'
        );

        setLoading(false);
        return;
      }

      try {
        const url =
          `${API_BASE_URL}/get-notifications.php` +
          `?userId=${encodeURIComponent(
            userId
          )}`;

        console.log(
          '===================================='
        );

        console.log(
          'GET NOTIFICATIONS URL:',
          url
        );

        const response =
          await fetch(url);

        const rawResponse =
          await response.text();

        console.log(
          'NOTIFICATIONS RESPONSE:',
          rawResponse
        );

        let data: any;

        try {
          data = JSON.parse(
            rawResponse
          );
        } catch {
          throw new Error(
            'The notification server returned invalid JSON.'
          );
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              data.message ||
              'Failed to load notifications.'
          );
        }

        const rows =
          Array.isArray(
            data.notifications
          )
            ? data.notifications
            : [];

        console.log(
          'NOTIFICATION COUNT:',
          rows.length
        );

        /*
        |--------------------------------------------------------------------------
        | FORMAT NOTIFICATIONS
        |--------------------------------------------------------------------------
        */

        const formatted: NotificationItem[] =
          rows.map(
            (
              item: any,
              index: number
            ) => {
              /*
              |--------------------------------------------------------------------------
              | JOB ID
              |--------------------------------------------------------------------------
              |
              | PHP returns:
              |
              | "jobId": 1
              |
              | We support both camelCase and snake_case.
              |
              */

              const rawJobId =
                item.jobId ??
                item.job_id ??
                item.jobID ??
                item.job?.jobId ??
                item.job?.job_id ??
                item.job?.id ??
                null;

              let parsedJobId:
                | number
                | null = null;

              if (
                rawJobId !== null &&
                rawJobId !== undefined
              ) {
                const numberValue =
                  Number(rawJobId);

                if (
                  Number.isFinite(
                    numberValue
                  ) &&
                  numberValue > 0
                ) {
                  parsedJobId =
                    numberValue;
                }
              }

              /*
              |--------------------------------------------------------------------------
              | JOB TITLE
              |--------------------------------------------------------------------------
              */

              const jobTitle =
                item.jobTitle ??
                item.job_title ??
                item.job?.title ??
                '';

              /*
              |--------------------------------------------------------------------------
              | NOTIFICATION TYPE
              |--------------------------------------------------------------------------
              */

              let type: NotificationType =
                'system';

              const rawType =
                item.notificationType ??
                item.notification_type ??
                '';

              switch (rawType) {
                case 'Application':
                case 'application':
                  type =
                    'application';
                  break;

                case 'Request':
                case 'request':
                  type =
                    'request';
                  break;

                case 'Message':
                case 'message':
                  type =
                    'message';
                  break;

                case 'Verification':
                case 'verification':
                  type =
                    'verification';
                  break;

                case 'System':
                case 'system':
                  type =
                    'system';
                  break;

                default:
                  type =
                    'system';
              }

              /*
              |--------------------------------------------------------------------------
              | NOTIFICATION ID
              |--------------------------------------------------------------------------
              */

              const notificationId =
                Number(
                  item.id ??
                  item.notificationId ??
                  item.notification_id ??
                  0
                );

              /*
              |--------------------------------------------------------------------------
              | READ STATUS
              |--------------------------------------------------------------------------
              */

              const rawRead =
                item.isRead ??
                item.is_read ??
                0;

              const isRead =
                rawRead === true ||
                Number(rawRead) === 1;

              /*
              |--------------------------------------------------------------------------
              | DEBUG
              |--------------------------------------------------------------------------
              */

              console.log(
                `NOTIFICATION #${
                  index + 1
                }`,
                {
                  id: notificationId,
                  type,
                  rawJobId,
                  parsedJobId,
                  jobTitle,
                  message:
                    item.message,
                  isRead,
                }
              );

              /*
              |--------------------------------------------------------------------------
              | TITLE
              |--------------------------------------------------------------------------
              */

              let title =
                item.title ||
                'Notification';

              if (
                type ===
                'application'
              ) {
                title =
                  'New Job Application';
              }

              return {
                id:
                  notificationId,

                jobId:
                  parsedJobId,

                jobTitle:
                  String(jobTitle),

                type,

                title,

                message:
                  String(
                    item.message ??
                      ''
                  ),

                time:
                  item.createdAt ??
                  item.created_at ??
                  '',

                read:
                  isRead,
              };
            }
          );

        console.log(
          '===================================='
        );

        console.log(
          'FORMATTED NOTIFICATIONS:',
          formatted
        );

        console.log(
          '===================================='
        );

        setNotifications(
          formatted
        );
      } catch (error: any) {
        console.error(
          'Fetch notifications error:',
          error
        );

        Alert.alert(
          'Unable to Load Notifications',
          error?.message ||
            'Something went wrong.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [userId]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh =
    async () => {
      setRefreshing(true);
      await fetchNotifications();
    };

  /*
  |--------------------------------------------------------------------------
  | MARK READ
  |--------------------------------------------------------------------------
  */

  const markAsRead =
    async (
      notificationId: number
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/mark-notification-read.php`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                notificationId,
                userId:
                  Number(userId),
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          console.warn(
            'Mark read failed:',
            data
          );
        }
      } catch (error) {
        console.error(
          'Mark read error:',
          error
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,
                    read: true,
                  }
                : item
          )
      );
    };

  /*
  |--------------------------------------------------------------------------
  | OPEN NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const openNotification =
    async (
      notification: NotificationItem
    ) => {
      console.log(
        '===================================='
      );

      console.log(
        'OPEN NOTIFICATION'
      );

      console.log(
        'Notification ID:',
        notification.id
      );

      console.log(
        'Notification Type:',
        notification.type
      );

      console.log(
        'Notification Job ID:',
        notification.jobId
      );

      console.log(
        'Notification Job Title:',
        notification.jobTitle
      );

      console.log(
        'Employer User ID:',
        userId
      );

      console.log(
        'Employer Full Name:',
        fullName
      );

      console.log(
        '===================================='
      );

      /*
      |--------------------------------------------------------------------------
      | APPLICATION NOTIFICATION
      |--------------------------------------------------------------------------
      */

      if (
        notification.type ===
        'application'
      ) {
        /*
        |--------------------------------------------------------------------------
        | VALIDATE EMPLOYER ID
        |--------------------------------------------------------------------------
        */

        if (!userId) {
          Alert.alert(
            'Employer ID Missing',
            'The employer account ID was not found.'
          );

          console.error(
            'MISSING EMPLOYER USER ID'
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE JOB ID
        |--------------------------------------------------------------------------
        */

        if (
          notification.jobId ===
            null ||
          notification.jobId <= 0
        ) {
          Alert.alert(
            'Job ID Missing',
            'This application notification does not contain a valid job ID.'
          );

          console.error(
            'MISSING JOB ID:',
            notification
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | MARK NOTIFICATION AS READ
        |--------------------------------------------------------------------------
        */

        await markAsRead(
          notification.id
        );

        /*
        |--------------------------------------------------------------------------
        | CREATE EXPLICIT QUERY URL
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | We use a literal URL here instead of
        | router.push({ pathname, params }).
        |
        | This guarantees that Expo Router receives
        | userId and jobId as query parameters.
        |
        */

        const applicantRoute =
          `/employer/applicants` +
          `?userId=${encodeURIComponent(
            String(userId)
          )}` +
          `&fullName=${encodeURIComponent(
            String(fullName)
          )}` +
          `&jobId=${encodeURIComponent(
            String(
              notification.jobId
            )
          )}` +
          `&jobTitle=${encodeURIComponent(
            String(
              notification.jobTitle ||
                ''
            )
          )}`;

        console.log(
          '===================================='
        );

        console.log(
          'OPENING APPLICANTS'
        );

        console.log(
          'EMPLOYER ID:',
          userId
        );

        console.log(
          'JOB ID:',
          notification.jobId
        );

        console.log(
          'JOB TITLE:',
          notification.jobTitle
        );

        console.log(
          'APPLICANT ROUTE:',
          applicantRoute
        );

        console.log(
          '===================================='
        );

        /*
        |--------------------------------------------------------------------------
        | NAVIGATE
        |--------------------------------------------------------------------------
        */

        router.push(
          applicantRoute as any
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | OTHER NOTIFICATIONS
      |--------------------------------------------------------------------------
      */

      await markAsRead(
        notification.id
      );
    };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteNotification =
    async (
      notificationId: number
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/delete-notification.php`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                notificationId,
                userId:
                  Number(userId),
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              data.message ||
              'Failed to delete notification.'
          );
        }

        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                notificationId
            )
        );
      } catch (error: any) {
        Alert.alert(
          'Delete Failed',
          error?.message ||
            'Unable to delete notification.'
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | MARK ALL READ
  |--------------------------------------------------------------------------
  */

  const markAllRead =
    async () => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/mark-all-notifications-read.php`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                userId:
                  Number(userId),
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              data.message ||
              'Failed to mark notifications as read.'
          );
        }

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                read: true,
              })
            )
        );
      } catch (error: any) {
        Alert.alert(
          'Unable to Update',
          error?.message ||
            'Something went wrong.'
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={BLUE}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading notifications...
        </Text>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={styles.container}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={DARK_BLUE}
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerContent
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Notifications
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Stay updated on your jobs
          </Text>
        </View>

        {notifications.some(
          (item) => !item.read
        ) && (
          <TouchableOpacity
            onPress={
              markAllRead
            }
            style={
              styles.markAllButton
            }
          >
            <Text
              style={
                styles.markAllText
              }
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT */}

      <ScrollView
        contentContainerStyle={
          notifications.length === 0
            ? styles.emptyScroll
            : styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor={BLUE}
          />
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {notifications.length ===
        0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="notifications-outline"
                size={42}
                color={BLUE}
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No notifications
            </Text>

            <Text
              style={
                styles.emptyMessage
              }
            >
              You're all caught up.
            </Text>
          </View>
        ) : (
          notifications.map(
            (notification) => (
              <NotificationCard
                key={
                  notification.id
                }
                notification={
                  notification
                }
                onPress={() =>
                  openNotification(
                    notification
                  )
                }
                onDelete={() =>
                  deleteNotification(
                    notification.id
                  )
                }
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    centerContainer: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 24,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: MUTED,
    },

    header: {
      backgroundColor:
        WHITE,
      paddingTop: 52,
      paddingHorizontal: 20,
      paddingBottom: 18,
      flexDirection:
        'row',
      alignItems:
        'center',
      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        LIGHT_BLUE,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 13,
    },

    headerContent: {
      flex: 1,
    },

    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: DARK_BLUE,
    },

    headerSubtitle: {
      marginTop: 3,
      fontSize: 13,
      color: MUTED,
    },

    markAllButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    markAllText: {
      fontSize: 11,
      fontWeight: '700',
      color: BLUE,
    },

    scrollContent: {
      padding: 16,
      paddingBottom: 35,
    },

    emptyScroll: {
      flexGrow: 1,
      justifyContent:
        'center',
      padding: 30,
    },

    notificationCard: {
      backgroundColor:
        WHITE,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        BORDER,
      padding: 15,
      marginBottom: 12,
      flexDirection:
        'row',
      alignItems:
        'flex-start',
    },

    unreadCard: {
      borderColor:
        '#B9D8ED',
      backgroundColor:
        '#FBFDFF',
    },

    iconContainer: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor:
        LIGHT_BLUE,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 12,
    },

    notificationContent: {
      flex: 1,
    },

    titleRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    notificationTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: DARK_BLUE,
    },

    unreadTitle: {
      fontWeight: '800',
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        BLUE,
      marginLeft: 7,
    },

    notificationMessage: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: MUTED,
    },

    bottomRow: {
      marginTop: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    timeText: {
      fontSize: 10,
      color: MUTED,
    },

    viewApplicantsText: {
      marginLeft: 'auto',
      fontSize: 11,
      fontWeight: '800',
      color: BLUE,
    },

    deleteButton: {
      marginLeft: 8,
      padding: 7,
    },

    emptyContainer: {
      alignItems:
        'center',
    },

    emptyIcon: {
      width: 88,
      height: 88,
      borderRadius: 30,
      backgroundColor:
        LIGHT_BLUE,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: DARK_BLUE,
      textAlign:
        'center',
    },

    emptyMessage: {
      marginTop: 8,
      fontSize: 14,
      color: MUTED,
      textAlign:
        'center',
    },
  });