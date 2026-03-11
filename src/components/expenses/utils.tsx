import React from 'react';
import { 
    Sofa, 
    PlaneTakeoff, 
    Car, 
    GraduationCap, 
    Heart, 
    Smartphone, 
    Gift, 
    Umbrella, 
    Palmtree, 
    TrendingDown 
} from "lucide-react";
import { ExpenseCategory } from "@/types/expenses";

export function getSuggestedCategoryId(storeName: string, categories: ExpenseCategory[]) {
    const name = storeName.toLowerCase();
    
    const findId = (names: string[]) => {
        const found = categories.find(c => names.includes(c.name));
        return found?.id || '';
    };

    if (name.includes('7-11') || name.includes('全家') || name.includes('鼎泰豐') || name.includes('星巴克')) {
        return findId(['餐飲外食', '餐飲美食']);
    }
    if (name.includes('捷運') || name.includes('uber') || name.includes('高鐵') || name.includes('星宇')) {
        return findId(['交通機票', '交通運輸']);
    }
    if (name.includes('台電') || name.includes('水費') || name.includes('netflix') || name.includes('瓦斯')) {
        return findId(['水電瓦斯', '水電費', '其他支出']);
    }
    if (name.includes('ikea') || name.includes('家樂福') || name.includes('採買')) {
        return findId(['日常採買', '居家生活']);
    }
    if (name.includes('裝修') || name.includes('工程') || name.includes('櫃')) {
        return findId(['裝潢工程', '新家裝修']);
    }
    if (name.includes('沙發') || name.includes('家具')) {
        return findId(['軟裝家具', '居家生活']);
    }
    return '';
}

export function getGoalIcon(goalName: string) {
    const name = goalName.toLowerCase();
    if (name.includes('家') || name.includes('房') || name.includes('home') || name.includes('裝潢')) return <Sofa className="w-5 h-5" />;
    if (name.includes('旅') || name.includes('日本') || name.includes('出國') || name.includes('travel')) return <PlaneTakeoff className="w-5 h-5" />;
    if (name.includes('車') || name.includes('car')) return <Car className="w-5 h-5" />;
    if (name.includes('學') || name.includes('教育') || name.includes('study')) return <GraduationCap className="w-5 h-5" />;
    if (name.includes('婚') || name.includes('愛') || name.includes('love')) return <Heart className="w-5 h-5" />;
    if (name.includes('電') || name.includes('手機') || name.includes('tech')) return <Smartphone className="w-5 h-5" />;
    if (name.includes('禮') || name.includes('送') || name.includes('gift')) return <Gift className="w-5 h-5" />;
    if (name.includes('兒') || name.includes('寶')) return <Heart className="w-5 h-5" />;
    if (name.includes('外') || name.includes('露營') || name.includes('雨')) return <Umbrella className="w-5 h-5" />;
    if (name.includes('假') || name.includes('海') || name.includes('島')) return <Palmtree className="w-5 h-5" />;
    
    return <TrendingDown className="w-5 h-5" />; 
}

export function getGoalColor(goalName: string): "blue" | "indigo" | "amber" | "teal" | "rose" | "emerald" | "violet" {
    const name = goalName.toLowerCase();
    if (name.includes('家') || name.includes('裝潢')) return "indigo";
    if (name.includes('旅') || name.includes('日本')) return "emerald";
    if (name.includes('車')) return "blue";
    if (name.includes('學')) return "violet";
    if (name.includes('愛') || name.includes('禮')) return "rose";
    return "teal";
}
