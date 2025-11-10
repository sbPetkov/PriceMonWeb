from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Sum, Min
from django.shortcuts import get_object_or_404

from .models import ShoppingList, ShoppingListMember, ShoppingListItem
from .serializers import (
    ShoppingListSerializer, ShoppingListListSerializer,
    ShoppingListMemberSerializer, ShoppingListItemSerializer
)
from products.models import Product, ProductPrice, Store
from users.models import User


class ShoppingListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing shopping lists.
    Users can create lists, add members, and manage items.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get lists owned by or shared with current user"""
        user = self.request.user
        return ShoppingList.objects.filter(
            Q(owner=user) | Q(members__user=user)
        ).distinct().prefetch_related('members', 'items')

    def get_serializer_class(self):
        """Use lighter serializer for list view"""
        if self.action == 'list':
            return ShoppingListListSerializer
        return ShoppingListSerializer

    def perform_create(self, serializer):
        """Create list and automatically add creator as owner member"""
        shopping_list = serializer.save(owner=self.request.user)

        # Create owner membership
        ShoppingListMember.objects.create(
            shopping_list=shopping_list,
            user=self.request.user,
            role='owner'
        )

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the shopping list"""
        shopping_list = self.get_object()

        # Check if user has permission (must be owner)
        if shopping_list.owner != request.user:
            return Response(
                {'error': 'Only the owner can add members'},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email')
        role = request.data.get('role', 'editor')

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': f'No user found with email: {email}'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already a member
        if ShoppingListMember.objects.filter(shopping_list=shopping_list, user=user).exists():
            return Response(
                {'error': 'User is already a member of this list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add member
        member = ShoppingListMember.objects.create(
            shopping_list=shopping_list,
            user=user,
            role=role
        )

        return Response(
            ShoppingListMemberSerializer(member).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove a member from the shopping list"""
        shopping_list = self.get_object()

        # Check if user has permission (must be owner)
        if shopping_list.owner != request.user:
            return Response(
                {'error': 'Only the owner can remove members'},
                status=status.HTTP_403_FORBIDDEN
            )

        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Can't remove owner
        if int(user_id) == shopping_list.owner.id:
            return Response(
                {'error': 'Cannot remove the owner from the list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member = ShoppingListMember.objects.filter(
            shopping_list=shopping_list,
            user_id=user_id
        ).first()

        if not member:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        member.delete()
        return Response({'message': 'Member removed successfully'})

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add an item to the shopping list (or increment quantity if it already exists)"""
        shopping_list = self.get_object()

        # Check if user has permission (owner or editor)
        member = ShoppingListMember.objects.filter(
            shopping_list=shopping_list,
            user=request.user
        ).first()

        if not member:
            return Response(
                {'error': 'You are not a member of this list'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if this is a product item (not custom)
        product_id = request.data.get('product_id')
        quantity_to_add = int(request.data.get('quantity', 1))

        if product_id:
            # Check if this product already exists in the shopping list
            existing_item = ShoppingListItem.objects.filter(
                shopping_list=shopping_list,
                product_id=product_id
            ).first()

            if existing_item:
                # Increment the quantity of the existing item
                existing_item.quantity += quantity_to_add
                existing_item.save()

                return Response(
                    ShoppingListItemSerializer(existing_item).data,
                    status=status.HTTP_200_OK
                )

        # Create new item (either custom item or product doesn't exist yet)
        data = request.data.copy()
        data['shopping_list'] = shopping_list.id

        serializer = ShoppingListItemSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(
            shopping_list=shopping_list,
            added_by=request.user
        )

        return Response(
            ShoppingListItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'])
    def update_item(self, request, pk=None):
        """Update an item in the shopping list"""
        shopping_list = self.get_object()
        item_id = request.data.get('item_id')

        if not item_id:
            return Response(
                {'error': 'item_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item = get_object_or_404(
            ShoppingListItem,
            id=item_id,
            shopping_list=shopping_list
        )

        # Update item
        serializer = ShoppingListItemSerializer(
            item,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def remove_item(self, request, pk=None):
        """Remove an item from the shopping list"""
        shopping_list = self.get_object()
        item_id = request.data.get('item_id')

        if not item_id:
            return Response(
                {'error': 'item_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item = ShoppingListItem.objects.filter(
            id=item_id,
            shopping_list=shopping_list
        ).first()

        if not item:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        item.delete()
        return Response({'message': 'Item removed successfully'})

    @action(detail=True, methods=['post'])
    def compare_stores(self, request, pk=None):
        """Compare total prices at different stores for this shopping list"""
        shopping_list = self.get_object()
        store_ids = request.data.get('store_ids', [])

        if not store_ids or len(store_ids) < 2:
            return Response(
                {'error': 'At least 2 store IDs are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all items with products (custom items don't have prices)
        items = shopping_list.items.filter(product__isnull=False)

        comparison = []
        for store_id in store_ids:
            store = get_object_or_404(Store, id=store_id)

            total_price = 0
            items_with_prices = 0
            items_without_prices = []

            for item in items:
                # Get latest price for this product at this store
                latest_price = ProductPrice.objects.filter(
                    product=item.product,
                    store=store,
                    status='approved'
                ).order_by('-created_at').first()

                if latest_price:
                    total_price += float(latest_price.price_eur) * item.quantity
                    items_with_prices += 1
                else:
                    items_without_prices.append(item.product.name)

            comparison.append({
                'store_id': store.id,
                'store_name': store.name,
                'total_price_eur': round(total_price, 2),
                'total_price_bgn': round(total_price * 1.95583, 2),
                'items_with_prices': items_with_prices,
                'items_without_prices': items_without_prices,
                'coverage_percent': round((items_with_prices / items.count() * 100) if items.count() > 0 else 0, 1)
            })

        # Sort by total price (cheapest first)
        comparison.sort(key=lambda x: x['total_price_eur'])

        return Response({
            'total_items': items.count(),
            'stores': comparison
        })
