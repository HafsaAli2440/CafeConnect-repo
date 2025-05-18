import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { API_BASE_URL } from "@/config/config";

// Define types for the revenue data
interface DateRange {
  start: string;
  end: string;
}

interface PaymentMethodStats {
  count: number;
  total: number;
}

interface DailyRevenue {
  _id: string;
  revenue: number;
  orderCount: number;
}

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethodStats: Record<string, PaymentMethodStats>;
  dailyRevenue: DailyRevenue[];
  dateRange: DateRange;
}

const RevenueOverviewScreen = () => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      // Get the first day of current month and today's date
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      
      console.log('Fetching revenue data...'); // Debug log
      const response = await fetch(
        `${API_BASE_URL}/revenue-report?startDate=${firstDay.toISOString()}&endDate=${today.toISOString()}`
      );
      
      const data = await response.json();
      console.log('Revenue data received:', data); // Debug log
      
      if (data.success) {
        setRevenueData(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch revenue data');
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
      Alert.alert('Error', 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!revenueData) {
      Alert.alert('Error', 'No revenue data available');
      return;
    }

    // Navigate to detailed report screen with the data
    router.push({
      pathname: '/(appPages)/(Admin)/DetailedReport',
      params: {
        reportData: JSON.stringify(revenueData)
      }
    });
  };

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <AntDesign onPress={handleBackPress} name="arrowleft" size={26} color="#4E1365" style={styles.backArrow} />
        <Text style={styles.headerText}>Revenue Overview</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4E1365" />
        ) : (
          <View style={styles.ordersContainer}>
            <View style={styles.detailsContainer}>
              <Text style={styles.revenueTitle}>Total Revenue</Text>
              <Text style={styles.revenueAmount}>
                {revenueData ? formatCurrency(revenueData.totalRevenue) : 'PKR 0.00'}
              </Text>
              <Text style={styles.dateRange}>
                From {revenueData?.dateRange ? new Date(revenueData.dateRange.start).toLocaleDateString() : '-'} to{' '}
                {revenueData?.dateRange ? new Date(revenueData.dateRange.end).toLocaleDateString() : '-'}
              </Text>
              <Text style={styles.statsText}>
                Confirmed Orders: {revenueData?.totalOrders || 0}
              </Text>
              <Text style={styles.statsText}>
                Average Order Value: {revenueData ? formatCurrency(revenueData.averageOrderValue) : 'PKR 0.00'}
              </Text>
              <TouchableOpacity 
                style={styles.reportButton}
                onPress={handleGenerateReport}
              >
                <Text style={styles.reportButtonText}>Generate Detailed Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4A006E",
    padding: 10
  },
  innerContainer: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
  },
  headerText: {
    fontSize: 32,
    color: '#4E1365',
    textAlign: 'center',
    padding: 16,
},
  backArrow: {
    position: 'absolute',
    top: 23,
    left: 10,
    zIndex: 2,
  },
  ordersContainer: {
    backgroundColor: '#45115A',
    paddingTop: 16,
    flex: 1
  },
  detailsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 16,
    padding: 16,
    elevation: 4,
  },
  revenueTitle: {
    fontSize: 18,
    color: "#4E1365",
    fontWeight: "bold",
  },
  revenueAmount: {
    fontSize: 22,
    color: "#4E1365",
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
  },
  statsText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: "#4E1365",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 60,
    alignItems: "center",
    alignSelf: "center",
  },
  reportButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RevenueOverviewScreen;
