from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ShoppingList, ShoppingListMember, ShoppingListItem
from products.models import Product
from products.serializers import ProductListSerializer
from users.serializers import UserSerializer

User = get_user_model()


class ShoppingListMemberSerializer(serializers.ModelSerializer):
    """Serializer for shopping list members"""
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=False
    )

    class Meta:
        model = ShoppingListMember
        fields = ['id', 'user', 'user_id', 'role', 'added_at']
        read_only_fields = ['id', 'added_at']


class ShoppingListItemSerializer(serializers.ModelSerializer):
    """Serializer for shopping list items"""
    product_details = ProductListSerializer(source='product', read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(status='approved'),
        source='product',
        write_only=True,
        required=False,
        allow_null=True
    )
    name = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingListItem
        fields = [
            'id', 'product', 'product_id', 'product_details',
            'custom_name', 'name', 'quantity', 'checked',
            'added_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'added_by', 'created_at', 'updated_at']

    def get_name(self, obj):
        """Get item name (from product or custom)"""
        return obj.name

    def validate(self, data):
        """Ensure either product or custom_name is set"""
        # Skip validation for partial updates that don't touch product/custom_name
        if self.partial and 'product' not in data and 'custom_name' not in data:
            return data

        # For create or when updating product/custom_name fields
        # Get from instance if this is an update
        if self.instance:
            product = data.get('product', self.instance.product)
            custom_name = data.get('custom_name', self.instance.custom_name)
        else:
            product = data.get('product')
            custom_name = data.get('custom_name', '')

        if not product and not custom_name:
            raise serializers.ValidationError("Item must have either a product or custom_name")
        if product and custom_name:
            raise serializers.ValidationError("Item cannot have both product and custom_name")

        return data


class ShoppingListSerializer(serializers.ModelSerializer):
    """Detailed serializer for shopping lists"""
    owner = UserSerializer(read_only=True)
    members = ShoppingListMemberSerializer(many=True, read_only=True)
    items = ShoppingListItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    checked_count = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingList
        fields = [
            'id', 'name', 'owner', 'members', 'items',
            'item_count', 'checked_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_item_count(self, obj):
        """Get total number of items in list"""
        return obj.items.count()

    def get_checked_count(self, obj):
        """Get number of checked items"""
        return obj.items.filter(checked=True).count()


class ShoppingListListSerializer(serializers.ModelSerializer):
    """Light serializer for listing shopping lists (without items)"""
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    checked_count = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingList
        fields = [
            'id', 'name', 'owner', 'member_count',
            'item_count', 'checked_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        """Get number of members (excluding owner)"""
        return obj.members.exclude(user=obj.owner).count()

    def get_item_count(self, obj):
        """Get total number of items in list"""
        return obj.items.count()

    def get_checked_count(self, obj):
        """Get number of checked items"""
        return obj.items.filter(checked=True).count()
